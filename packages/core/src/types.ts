/**
 * Core type definitions for EnvSync
 */

export type EnvironmentType = 'local' | 'staging' | 'production' | 'ci' | 'docker';

export type DriftCategory = 'nodejs' | 'dependency' | 'envvar' | 'docker' | 'binary';

export type DriftSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Node.js version information
 */
export interface NodeVersionInfo {
  version: string;
  npmVersion: string;
  platform: NodeJS.Platform;
  arch: string;
  v8Version: string;
  modules: string; // ABI version
  openssl?: string;
}

/**
 * Native module information (binary compatibility)
 */
export interface NativeModuleInfo {
  name: string;
  path: string;
  platform: NodeJS.Platform;
  arch: string;
  nodeAbi: string;
  size: number;
  modified: Date;
}

/**
 * Dependency snapshot
 */
export interface DependencySnapshot {
  production: Record<string, string>;
  development: Record<string, string>;
  lockfileHash: string;
  nativeModules: NativeModuleInfo[];
}

/**
 * Environment variables (with redaction support)
 */
export interface EnvironmentVariables {
  variables: Record<string, string>;
  redacted: string[];
}

/**
 * Docker image information
 */
export interface DockerImage {
  id: string;
  tags: string[];
  size: number;
  created?: Date;
}

/**
 * Docker container information
 */
export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: string;
  ports?: unknown[];
}

/**
 * Docker Compose configuration
 */
export interface DockerComposeConfig {
  file: string;
  version?: string;
  services: string[];
  networks: string[];
  volumes: string[];
}

/**
 * Docker snapshot
 */
export interface DockerSnapshot {
  version: string | null;
  platform: string | null;
  arch: string | null;
  images: DockerImage[];
  containers: DockerContainer[];
  composeConfigs: DockerComposeConfig[];
}

/**
 * System information
 */
export interface SystemInfo {
  platform: NodeJS.Platform;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  hostname: string;
}

/**
 * Complete environment snapshot
 */
export interface EnvironmentSnapshot {
  timestamp: Date;
  environment: EnvironmentType;
  nodeVersion: NodeVersionInfo;
  dependencies: DependencySnapshot;
  envVars: EnvironmentVariables;
  docker: DockerSnapshot;
  system: SystemInfo;
  hash: string;
}

/**
 * Individual drift item
 */
export interface Drift {
  category: DriftCategory;
  severity: DriftSeverity;
  field: string;
  local: unknown;
  remote: unknown;
  impact: string;
  recommendation: string;
}

/**
 * Drift summary statistics
 */
export interface DriftSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byCategory: Record<DriftCategory, number>;
}

/**
 * Complete drift report
 */
export interface DriftReport {
  hasDrift: boolean;
  severity: DriftSeverity;
  drifts: Drift[];
  summary: DriftSummary;
  localSnapshot: EnvironmentSnapshot;
  remoteSnapshot: EnvironmentSnapshot;
}

/**
 * Sync action result
 */
export interface SyncAction {
  drift: Drift;
  success: boolean;
  action?: string;
  error?: string;
}

/**
 * Sync options
 */
export interface SyncOptions {
  autoFix?: boolean;
  dryRun?: boolean;
  categories?: DriftCategory[];
  maxSeverity?: DriftSeverity;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  actions: SyncAction[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

/**
 * Snapshot capture options
 */
export interface SnapshotOptions {
  redactSensitive?: boolean;
  includeDocker?: boolean;
  includeNativeModules?: boolean;
}

/**
 * Lockfile information
 */
export interface LockfileSnapshot {
  type: 'npm' | 'yarn' | 'pnpm';
  version: string;
  hash: string;
  packages: Record<string, {
    version: string;
    resolved?: string;
    integrity?: string;
  }>;
}
