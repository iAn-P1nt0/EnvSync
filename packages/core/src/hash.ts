/**
 * Snapshot hashing utilities
 */

import { createHash } from 'crypto';
import type { EnvironmentSnapshot } from './types.js';

/**
 * Generate hash for environment snapshot
 */
export function hashSnapshot(snapshot: EnvironmentSnapshot): string {
  const data = {
    nodeVersion: snapshot.nodeVersion.version,
    platform: snapshot.nodeVersion.platform,
    arch: snapshot.nodeVersion.arch,
    modules: snapshot.nodeVersion.modules,
    dependenciesHash: snapshot.dependencies.lockfileHash,
    envVarsCount: Object.keys(snapshot.envVars.variables).length,
    dockerVersion: snapshot.docker.version,
    imagesCount: snapshot.docker.images.length,
  };

  return createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
    .substring(0, 16);
}

/**
 * Compare snapshot hashes for quick equality check
 */
export function compareSnapshotHashes(
  hash1: string,
  hash2: string
): boolean {
  return hash1 === hash2;
}
