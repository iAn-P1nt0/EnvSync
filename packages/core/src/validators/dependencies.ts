/**
 * Dependencies validator
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { createHash } from 'crypto';
import type { DependencySnapshot, NativeModuleInfo, LockfileSnapshot } from '../types.js';

/**
 * Capture dependencies from package.json and lockfile
 */
export async function captureDependencies(
  cwd: string = process.cwd()
): Promise<DependencySnapshot> {
  const packageJsonPath = join(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const lockfile = await parseLockfile(cwd);
  const nativeModules = await detectNativeModules(cwd);

  return {
    production: packageJson.dependencies || {},
    development: packageJson.devDependencies || {},
    lockfileHash: lockfile.hash,
    nativeModules,
  };
}

/**
 * Parse lockfile (supports npm, yarn, pnpm)
 */
async function parseLockfile(cwd: string): Promise<LockfileSnapshot> {
  // Try npm first
  const npmLockPath = join(cwd, 'package-lock.json');
  if (existsSync(npmLockPath)) {
    const content = readFileSync(npmLockPath, 'utf-8');
    const lockData = JSON.parse(content);

    return {
      type: 'npm',
      version: lockData.lockfileVersion?.toString() || '1',
      hash: hashContent(content),
      packages: parseLockfilePackages(lockData),
    };
  }

  // Try yarn
  const yarnLockPath = join(cwd, 'yarn.lock');
  if (existsSync(yarnLockPath)) {
    const content = readFileSync(yarnLockPath, 'utf-8');

    return {
      type: 'yarn',
      version: '1',
      hash: hashContent(content),
      packages: {},
    };
  }

  // Try pnpm
  const pnpmLockPath = join(cwd, 'pnpm-lock.yaml');
  if (existsSync(pnpmLockPath)) {
    const content = readFileSync(pnpmLockPath, 'utf-8');

    return {
      type: 'pnpm',
      version: '1',
      hash: hashContent(content),
      packages: {},
    };
  }

  throw new Error('No lockfile found (package-lock.json, yarn.lock, or pnpm-lock.yaml)');
}

/**
 * Parse packages from lockfile
 */
function parseLockfilePackages(lockData: any): Record<string, {
  version: string;
  resolved?: string;
  integrity?: string;
}> {
  const packages: Record<string, any> = {};

  if (lockData.packages) {
    for (const [path, pkg] of Object.entries<any>(lockData.packages)) {
      if (path === '') continue; // Skip root

      const name = path.replace(/^node_modules\//, '');
      packages[name] = {
        version: pkg.version,
        resolved: pkg.resolved,
        integrity: pkg.integrity,
      };
    }
  }

  return packages;
}

/**
 * Detect native Node.js modules (.node files)
 */
async function detectNativeModules(cwd: string): Promise<NativeModuleInfo[]> {
  const nodeModulesPath = join(cwd, 'node_modules');

  if (!existsSync(nodeModulesPath)) {
    return [];
  }

  // Find all .node files
  const nodeFiles = await glob('**/*.node', {
    cwd: nodeModulesPath,
    absolute: true,
    ignore: ['**/node_modules/**'],
  });

  const modules: NativeModuleInfo[] = [];

  for (const file of nodeFiles) {
    try {
      const stats = statSync(file);
      const moduleName = extractModuleName(file);

      modules.push({
        name: moduleName,
        path: file,
        platform: process.platform,
        arch: process.arch,
        nodeAbi: process.versions.modules,
        size: stats.size,
        modified: stats.mtime,
      });
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return modules;
}

/**
 * Extract module name from file path
 */
function extractModuleName(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  const nodeModulesIndex = parts.lastIndexOf('node_modules');

  if (nodeModulesIndex === -1) {
    return 'unknown';
  }

  // Handle scoped packages (@org/package)
  const afterNodeModules = parts[nodeModulesIndex + 1];
  if (afterNodeModules?.startsWith('@')) {
    return `${afterNodeModules}/${parts[nodeModulesIndex + 2]}`;
  }

  return afterNodeModules || 'unknown';
}

/**
 * Hash content for comparison
 */
function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Compare lockfile hashes
 */
export function compareLockfileHash(
  local: string,
  remote: string
): boolean {
  return local === remote;
}
