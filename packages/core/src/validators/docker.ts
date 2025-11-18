/**
 * Docker configuration validator
 */

import Docker from 'dockerode';
import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { parse as parseYAML } from 'yaml';
import type { DockerSnapshot, DockerComposeConfig } from '../types.js';

/**
 * Capture Docker configuration and state
 */
export async function captureDockerConfig(
  cwd: string = process.cwd()
): Promise<DockerSnapshot> {
  const docker = new Docker();

  try {
    // Try to connect to Docker daemon
    const version = await docker.version();
    const images = await docker.listImages();
    const containers = await docker.listContainers({ all: true });

    // Parse docker-compose files
    const composeConfigs = await parseDockerComposeFiles(cwd);

    return {
      version: version.Version,
      platform: version.Os,
      arch: version.Arch,
      images: images.map(img => ({
        id: img.Id.substring(7, 19), // Short ID
        tags: img.RepoTags || [],
        size: img.Size,
        created: img.Created ? new Date(img.Created * 1000) : undefined,
      })),
      containers: containers.map(c => ({
        id: c.Id.substring(0, 12),
        name: c.Names[0]?.replace(/^\//, '') || 'unnamed',
        image: c.Image,
        state: c.State,
        ports: c.Ports,
      })),
      composeConfigs,
    };
  } catch (error) {
    // Docker not available or not running
    return {
      version: null,
      platform: null,
      arch: null,
      images: [],
      containers: [],
      composeConfigs: await parseDockerComposeFiles(cwd),
    };
  }
}

/**
 * Find and parse docker-compose files
 */
async function parseDockerComposeFiles(cwd: string): Promise<DockerComposeConfig[]> {
  const composeFiles = await glob('**/docker-compose*.{yml,yaml}', {
    cwd,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**'],
  });

  const configs: DockerComposeConfig[] = [];

  for (const file of composeFiles) {
    try {
      if (!existsSync(file)) continue;

      const content = readFileSync(file, 'utf-8');
      const parsed = parseYAML(content);

      configs.push({
        file,
        version: parsed.version?.toString(),
        services: Object.keys(parsed.services || {}),
        networks: Object.keys(parsed.networks || {}),
        volumes: Object.keys(parsed.volumes || {}),
      });
    } catch (error) {
      // Skip invalid files
      continue;
    }
  }

  return configs;
}

/**
 * Compare Docker configurations
 */
export function compareDockerConfigs(
  local: DockerSnapshot,
  remote: DockerSnapshot
): {
  versionMismatch: boolean;
  missingImages: string[];
  extraImages: string[];
  configDifferences: string[];
} {
  const result = {
    versionMismatch: false,
    missingImages: [] as string[],
    extraImages: [] as string[],
    configDifferences: [] as string[],
  };

  // Check version mismatch
  if (local.version !== remote.version) {
    result.versionMismatch = true;
  }

  // Compare images
  const localImageTags = new Set(
    local.images.flatMap(img => img.tags)
  );
  const remoteImageTags = new Set(
    remote.images.flatMap(img => img.tags)
  );

  for (const tag of remoteImageTags) {
    if (!localImageTags.has(tag)) {
      result.missingImages.push(tag);
    }
  }

  for (const tag of localImageTags) {
    if (!remoteImageTags.has(tag)) {
      result.extraImages.push(tag);
    }
  }

  // Compare compose configs
  if (local.composeConfigs.length !== remote.composeConfigs.length) {
    result.configDifferences.push(
      `Compose file count mismatch: ${local.composeConfigs.length} vs ${remote.composeConfigs.length}`
    );
  }

  return result;
}
