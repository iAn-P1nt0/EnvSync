/**
 * Drift detection and comparison engine
 */

import semver from 'semver';
import { compareNativeModules } from './validators/binaries.js';
import { compareEnvVars } from './validators/env-vars.js';
import { compareDockerConfigs } from './validators/docker.js';
import type {
  EnvironmentSnapshot,
  DriftReport,
  Drift,
  DriftSummary,
  DriftSeverity,
  DriftCategory,
} from './types.js';

/**
 * Compare two environment snapshots and detect drift
 */
export function compareSnapshots(
  local: EnvironmentSnapshot,
  remote: EnvironmentSnapshot
): DriftReport {
  const drifts: Drift[] = [];

  // Compare Node.js versions
  drifts.push(...compareNodeVersions(local, remote));

  // Compare dependencies
  drifts.push(...compareDependencies(local, remote));

  // Compare environment variables
  drifts.push(...compareEnvironmentVars(local, remote));

  // Compare Docker configurations
  drifts.push(...compareDocker(local, remote));

  // Compare native modules
  drifts.push(...compareNativeModules(local.dependencies.nativeModules, remote.dependencies.nativeModules));

  // Generate summary
  const summary = generateSummary(drifts);

  // Assess overall severity
  const severity = assessOverallSeverity(drifts);

  return {
    hasDrift: drifts.length > 0,
    severity,
    drifts,
    summary,
    localSnapshot: local,
    remoteSnapshot: remote,
  };
}

/**
 * Compare Node.js versions
 */
function compareNodeVersions(
  local: EnvironmentSnapshot,
  remote: EnvironmentSnapshot
): Drift[] {
  const drifts: Drift[] = [];

  if (local.nodeVersion.version !== remote.nodeVersion.version) {
    const severity = assessNodeVersionDrift(
      local.nodeVersion.version,
      remote.nodeVersion.version
    );

    drifts.push({
      category: 'nodejs',
      severity,
      field: 'nodeVersion',
      local: local.nodeVersion.version,
      remote: remote.nodeVersion.version,
      impact: 'Runtime behavior differences, potential API incompatibilities',
      recommendation: `Update local Node.js to ${remote.nodeVersion.version}`,
    });
  }

  if (local.nodeVersion.npmVersion !== remote.nodeVersion.npmVersion) {
    drifts.push({
      category: 'nodejs',
      severity: 'low',
      field: 'npmVersion',
      local: local.nodeVersion.npmVersion,
      remote: remote.nodeVersion.npmVersion,
      impact: 'Package installation behavior may differ',
      recommendation: `Update npm to ${remote.nodeVersion.npmVersion}`,
    });
  }

  if (local.nodeVersion.platform !== remote.nodeVersion.platform) {
    drifts.push({
      category: 'nodejs',
      severity: 'critical',
      field: 'platform',
      local: local.nodeVersion.platform,
      remote: remote.nodeVersion.platform,
      impact: 'Platform mismatch - native modules will fail',
      recommendation: `Ensure platform compatibility or use Docker for consistency`,
    });
  }

  if (local.nodeVersion.arch !== remote.nodeVersion.arch) {
    drifts.push({
      category: 'nodejs',
      severity: 'critical',
      field: 'arch',
      local: local.nodeVersion.arch,
      remote: remote.nodeVersion.arch,
      impact: 'Architecture mismatch - binaries incompatible',
      recommendation: `Ensure architecture compatibility`,
    });
  }

  return drifts;
}

/**
 * Compare dependencies
 */
function compareDependencies(
  local: EnvironmentSnapshot,
  remote: EnvironmentSnapshot
): Drift[] {
  const drifts: Drift[] = [];

  // Combine production and development dependencies
  const allLocalPackages = {
    ...local.dependencies.production,
    ...local.dependencies.development,
  };

  const allRemotePackages = {
    ...remote.dependencies.production,
    ...remote.dependencies.development,
  };

  const allPackageNames = new Set([
    ...Object.keys(allLocalPackages),
    ...Object.keys(allRemotePackages),
  ]);

  for (const pkg of allPackageNames) {
    const localVer = allLocalPackages[pkg];
    const remoteVer = allRemotePackages[pkg];

    if (!localVer && remoteVer) {
      // Package missing locally
      drifts.push({
        category: 'dependency',
        severity: 'high',
        field: `dependency.${pkg}`,
        local: undefined,
        remote: remoteVer,
        impact: 'Missing dependency - may cause runtime errors',
        recommendation: `Install ${pkg}@${remoteVer}`,
      });
    } else if (localVer && !remoteVer) {
      // Extra package locally
      drifts.push({
        category: 'dependency',
        severity: 'medium',
        field: `dependency.${pkg}`,
        local: localVer,
        remote: undefined,
        impact: 'Extra dependency not in remote',
        recommendation: `Remove ${pkg} or add to remote environment`,
      });
    } else if (localVer !== remoteVer) {
      // Version mismatch
      const severity = assessVersionDrift(localVer, remoteVer);

      drifts.push({
        category: 'dependency',
        severity,
        field: `dependency.${pkg}`,
        local: localVer,
        remote: remoteVer,
        impact: describeVersionImpact(pkg, localVer, remoteVer),
        recommendation: `Update ${pkg} to ${remoteVer}`,
      });
    }
  }

  // Check lockfile hash
  if (local.dependencies.lockfileHash !== remote.dependencies.lockfileHash) {
    drifts.push({
      category: 'dependency',
      severity: 'high',
      field: 'lockfile',
      local: local.dependencies.lockfileHash.substring(0, 8),
      remote: remote.dependencies.lockfileHash.substring(0, 8),
      impact: 'Lockfile mismatch - exact dependency versions differ',
      recommendation: 'Sync lockfile to ensure identical dependency tree',
    });
  }

  return drifts;
}

/**
 * Compare environment variables
 */
function compareEnvironmentVars(
  local: EnvironmentSnapshot,
  remote: EnvironmentSnapshot
): Drift[] {
  const drifts: Drift[] = [];
  const comparison = compareEnvVars(local.envVars, remote.envVars);

  for (const key of comparison.missing) {
    drifts.push({
      category: 'envvar',
      severity: 'high',
      field: `env.${key}`,
      local: undefined,
      remote: '[SET]',
      impact: 'Missing environment variable - may cause runtime errors',
      recommendation: `Set ${key} in local environment`,
    });
  }

  for (const key of comparison.extra) {
    drifts.push({
      category: 'envvar',
      severity: 'low',
      field: `env.${key}`,
      local: '[SET]',
      remote: undefined,
      impact: 'Extra environment variable not in remote',
      recommendation: `Remove ${key} or add to remote environment`,
    });
  }

  for (const key of comparison.different) {
    drifts.push({
      category: 'envvar',
      severity: 'medium',
      field: `env.${key}`,
      local: local.envVars.variables[key],
      remote: remote.envVars.variables[key],
      impact: 'Environment variable value differs',
      recommendation: `Update ${key} to match remote value`,
    });
  }

  return drifts;
}

/**
 * Compare Docker configurations
 */
function compareDocker(
  local: EnvironmentSnapshot,
  remote: EnvironmentSnapshot
): Drift[] {
  const drifts: Drift[] = [];
  const comparison = compareDockerConfigs(local.docker, remote.docker);

  if (comparison.versionMismatch) {
    drifts.push({
      category: 'docker',
      severity: 'medium',
      field: 'docker.version',
      local: local.docker.version,
      remote: remote.docker.version,
      impact: 'Docker version mismatch - behavior may differ',
      recommendation: `Update Docker to ${remote.docker.version}`,
    });
  }

  for (const image of comparison.missingImages) {
    drifts.push({
      category: 'docker',
      severity: 'high',
      field: `docker.image.${image}`,
      local: undefined,
      remote: image,
      impact: 'Missing Docker image',
      recommendation: `Pull Docker image: docker pull ${image}`,
    });
  }

  for (const image of comparison.extraImages) {
    drifts.push({
      category: 'docker',
      severity: 'low',
      field: `docker.image.${image}`,
      local: image,
      remote: undefined,
      impact: 'Extra Docker image not in remote',
      recommendation: `Remove image or add to remote: ${image}`,
    });
  }

  return drifts;
}

/**
 * Assess severity of Node.js version drift
 */
function assessNodeVersionDrift(
  local: string,
  remote: string
): DriftSeverity {
  try {
    const localVer = semver.parse(local);
    const remoteVer = semver.parse(remote);

    if (!localVer || !remoteVer) return 'medium';

    // Major version difference = high severity
    if (localVer.major !== remoteVer.major) {
      return 'high';
    }

    // Minor version difference = medium severity
    if (localVer.minor !== remoteVer.minor) {
      return 'medium';
    }

    // Patch version difference = low severity
    return 'low';
  } catch {
    return 'medium';
  }
}

/**
 * Assess severity of dependency version drift
 */
function assessVersionDrift(
  local: string,
  remote: string
): DriftSeverity {
  try {
    const localVer = semver.parse(local);
    const remoteVer = semver.parse(remote);

    if (!localVer || !remoteVer) return 'medium';

    // Major version difference = high severity
    if (localVer.major !== remoteVer.major) {
      return 'high';
    }

    // Minor version difference = medium severity
    if (localVer.minor !== remoteVer.minor) {
      return 'medium';
    }

    // Patch version difference = low severity
    return 'low';
  } catch {
    return 'medium';
  }
}

/**
 * Describe version impact
 */
function describeVersionImpact(
  pkg: string,
  local: string,
  remote: string
): string {
  try {
    const localVer = semver.parse(local);
    const remoteVer = semver.parse(remote);

    if (!localVer || !remoteVer) {
      return 'Version format differs';
    }

    if (localVer.major !== remoteVer.major) {
      return `Major version change (${local} → ${remote}) - breaking changes likely`;
    }

    if (localVer.minor !== remoteVer.minor) {
      return `Minor version change (${local} → ${remote}) - new features or deprecations`;
    }

    return `Patch version change (${local} → ${remote}) - bug fixes`;
  } catch {
    return 'Version differs';
  }
}

/**
 * Generate drift summary
 */
function generateSummary(drifts: Drift[]): DriftSummary {
  const summary: DriftSummary = {
    total: drifts.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    byCategory: {
      nodejs: 0,
      dependency: 0,
      envvar: 0,
      docker: 0,
      binary: 0,
    },
  };

  for (const drift of drifts) {
    // Count by severity
    switch (drift.severity) {
      case 'critical':
        summary.critical++;
        break;
      case 'high':
        summary.high++;
        break;
      case 'medium':
        summary.medium++;
        break;
      case 'low':
        summary.low++;
        break;
    }

    // Count by category
    summary.byCategory[drift.category]++;
  }

  return summary;
}

/**
 * Assess overall severity from all drifts
 */
function assessOverallSeverity(drifts: Drift[]): DriftSeverity {
  if (drifts.length === 0) return 'none';

  const severities = drifts.map(d => d.severity);

  if (severities.includes('critical')) return 'critical';
  if (severities.includes('high')) return 'high';
  if (severities.includes('medium')) return 'medium';
  if (severities.includes('low')) return 'low';

  return 'none';
}
