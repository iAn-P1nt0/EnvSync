/**
 * Node.js version validator
 */

import { execSync } from 'child_process';
import type { NodeVersionInfo } from '../types.js';

/**
 * Capture Node.js version and platform information
 */
export async function captureNodeVersion(): Promise<NodeVersionInfo> {
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();

  return {
    version: process.version,
    npmVersion,
    platform: process.platform,
    arch: process.arch,
    v8Version: process.versions.v8,
    modules: process.versions.modules,
    openssl: process.versions.openssl,
  };
}

/**
 * Validate Node.js version compatibility
 */
export function validateNodeVersion(
  local: NodeVersionInfo,
  remote: NodeVersionInfo
): {
  compatible: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (local.version !== remote.version) {
    issues.push(`Node.js version mismatch: ${local.version} vs ${remote.version}`);
  }

  if (local.platform !== remote.platform) {
    issues.push(`Platform mismatch: ${local.platform} vs ${remote.platform}`);
  }

  if (local.arch !== remote.arch) {
    issues.push(`Architecture mismatch: ${local.arch} vs ${remote.arch}`);
  }

  if (local.modules !== remote.modules) {
    issues.push(`ABI version mismatch: ${local.modules} vs ${remote.modules}`);
  }

  return {
    compatible: issues.length === 0,
    issues,
  };
}
