/**
 * Binary compatibility validator for native modules
 */

import type { NativeModuleInfo, Drift } from '../types.js';

/**
 * Compare native modules for binary compatibility
 */
export function compareNativeModules(
  local: NativeModuleInfo[],
  remote: NativeModuleInfo[]
): Drift[] {
  const drifts: Drift[] = [];

  for (const localMod of local) {
    const remoteMod = remote.find(m => m.name === localMod.name);

    if (!remoteMod) {
      // Module exists locally but not remotely
      drifts.push({
        category: 'binary',
        severity: 'medium',
        field: `native.${localMod.name}`,
        local: localMod.platform,
        remote: undefined,
        impact: 'Native module exists locally but not in remote environment',
        recommendation: `Ensure ${localMod.name} is installed in remote or remove from local`,
      });
      continue;
    }

    // Check platform compatibility
    if (localMod.platform !== remoteMod.platform) {
      drifts.push({
        category: 'binary',
        severity: 'critical',
        field: `native.${localMod.name}.platform`,
        local: localMod.platform,
        remote: remoteMod.platform,
        impact: `Native module compiled for ${localMod.platform} but remote uses ${remoteMod.platform} - will crash`,
        recommendation: `Rebuild ${localMod.name} for ${remoteMod.platform} platform`,
      });
    }

    // Check architecture compatibility
    if (localMod.arch !== remoteMod.arch) {
      drifts.push({
        category: 'binary',
        severity: 'critical',
        field: `native.${localMod.name}.arch`,
        local: localMod.arch,
        remote: remoteMod.arch,
        impact: `Architecture mismatch: ${localMod.arch} vs ${remoteMod.arch} - module will fail to load`,
        recommendation: `Rebuild ${localMod.name} for ${remoteMod.arch} architecture`,
      });
    }

    // Check Node.js ABI compatibility
    if (localMod.nodeAbi !== remoteMod.nodeAbi) {
      drifts.push({
        category: 'binary',
        severity: 'critical',
        field: `native.${localMod.name}.abi`,
        local: localMod.nodeAbi,
        remote: remoteMod.nodeAbi,
        impact: `Incompatible Node.js ABI version (${localMod.nodeAbi} vs ${remoteMod.nodeAbi}) - module will fail to load`,
        recommendation: `Rebuild ${localMod.name} with Node.js version matching ABI ${remoteMod.nodeAbi}`,
      });
    }
  }

  // Check for modules in remote but not local
  for (const remoteMod of remote) {
    const localMod = local.find(m => m.name === remoteMod.name);

    if (!localMod) {
      drifts.push({
        category: 'binary',
        severity: 'high',
        field: `native.${remoteMod.name}`,
        local: undefined,
        remote: remoteMod.platform,
        impact: 'Native module required by remote but missing locally - may cause runtime errors',
        recommendation: `Install ${remoteMod.name} locally`,
      });
    }
  }

  return drifts;
}

/**
 * Check if a native module is compatible across platforms
 */
export function isNativeModuleCompatible(
  local: NativeModuleInfo,
  remote: NativeModuleInfo
): boolean {
  return (
    local.platform === remote.platform &&
    local.arch === remote.arch &&
    local.nodeAbi === remote.nodeAbi
  );
}
