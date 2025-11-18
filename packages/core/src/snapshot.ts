/**
 * Environment snapshot capture
 */

import { cpus, totalmem, freemem, hostname } from 'os';
import { captureNodeVersion } from './validators/node-version.js';
import { captureDependencies } from './validators/dependencies.js';
import { captureEnvVars } from './validators/env-vars.js';
import { captureDockerConfig } from './validators/docker.js';
import { hashSnapshot } from './hash.js';
import type {
  EnvironmentSnapshot,
  EnvironmentType,
  SystemInfo,
  SnapshotOptions,
} from './types.js';

/**
 * Detect current environment type
 */
export function detectEnvironment(): EnvironmentType {
  // Check NODE_ENV first
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'staging') return 'staging';
  if (nodeEnv === 'development') return 'local';

  // Check for CI environment
  if (process.env.CI === 'true' || process.env.CONTINUOUS_INTEGRATION === 'true') {
    return 'ci';
  }

  // Check if running in Docker
  if (process.env.DOCKER_CONTAINER === 'true' || process.env.IS_DOCKER === 'true') {
    return 'docker';
  }

  // Default to local
  return 'local';
}

/**
 * Capture system information
 */
function captureSystemInfo(): SystemInfo {
  return {
    platform: process.platform,
    arch: process.arch,
    cpus: cpus().length,
    totalMemory: totalmem(),
    freeMemory: freemem(),
    hostname: hostname(),
  };
}

/**
 * Capture complete environment snapshot
 */
export async function captureSnapshot(
  options: SnapshotOptions = {}
): Promise<EnvironmentSnapshot> {
  const {
    redactSensitive = true,
    includeDocker = true,
    includeNativeModules = true,
  } = options;

  // Capture all environment data in parallel
  const [nodeVersion, dependencies, envVars, docker, system] = await Promise.all([
    captureNodeVersion(),
    captureDependencies().catch(() => ({
      production: {},
      development: {},
      lockfileHash: '',
      nativeModules: [],
    })),
    Promise.resolve(captureEnvVars({ redactSensitive })),
    includeDocker
      ? captureDockerConfig().catch(() => ({
          version: null,
          platform: null,
          arch: null,
          images: [],
          containers: [],
          composeConfigs: [],
        }))
      : Promise.resolve({
          version: null,
          platform: null,
          arch: null,
          images: [],
          containers: [],
          composeConfigs: [],
        }),
    Promise.resolve(captureSystemInfo()),
  ]);

  // Filter native modules if not included
  if (!includeNativeModules) {
    dependencies.nativeModules = [];
  }

  const snapshot: EnvironmentSnapshot = {
    timestamp: new Date(),
    environment: detectEnvironment(),
    nodeVersion,
    dependencies,
    envVars,
    docker,
    system,
    hash: '', // Will be computed
  };

  // Compute hash
  snapshot.hash = hashSnapshot(snapshot);

  return snapshot;
}

/**
 * Save snapshot to file
 */
export function serializeSnapshot(snapshot: EnvironmentSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Load snapshot from file
 */
export function deserializeSnapshot(data: string): EnvironmentSnapshot {
  const parsed = JSON.parse(data);

  // Convert date strings back to Date objects
  parsed.timestamp = new Date(parsed.timestamp);

  if (parsed.docker?.images) {
    parsed.docker.images = parsed.docker.images.map((img: any) => ({
      ...img,
      created: img.created ? new Date(img.created) : undefined,
    }));
  }

  if (parsed.dependencies?.nativeModules) {
    parsed.dependencies.nativeModules = parsed.dependencies.nativeModules.map((mod: any) => ({
      ...mod,
      modified: new Date(mod.modified),
    }));
  }

  return parsed;
}
