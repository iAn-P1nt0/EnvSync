# AGENTS.md - AI Coding Agent Instructions for EnvSync

**Project**: EnvSync - Environment Parity Validator  
**Type**: TypeScript npm CLI tool + Library  
**Agent Compatibility**: Claude Code, GitHub Copilot, Cursor, Zed  
**Last Updated**: November 2025

---

## 📌 Project Overview

EnvSync eliminates "works on my machine" deployment failures by detecting and fixing environment drift between local, staging, and production environments. It validates Node.js versions, dependencies, native modules, environment variables, and Docker configurations before deployment[449][450][452][455].

**Primary Goals:**
1. Environment snapshot capture (complete state including Docker)[449][450]
2. Drift detection across environments with severity assessment[451][454]
3. Binary compatibility validation for native Node modules[443][447]
4. One-click synchronization to fix drift[449][450]
5. CI/CD integration for proactive validation[449][453]

---

## 🎯 Agent Objectives

When working on EnvSync, AI agents must:

1. **Accuracy-first**: Environment detection must be 100% accurate
2. **Safety-conscious**: Never modify environments without explicit confirmation
3. **Platform-aware**: Handle Windows, macOS, Linux differences correctly
4. **Docker-compatible**: Properly detect and sync Docker configurations[440][449][450]
5. **Well-tested**: Comprehensive tests for all environment scenarios
6. **CI/CD ready**: Must work reliably in automated pipelines[449][453]

---

## 🏗️ Project Structure

```
envsync/
├── packages/
│   ├── core/                      # Core detection engine
│   │   ├── src/
│   │   │   ├── snapshot.ts        # Environment snapshot
│   │   │   ├── compare.ts         # Drift detection
│   │   │   ├── validators/        # Individual validators
│   │   │   │   ├── node-version.ts
│   │   │   │   ├── dependencies.ts
│   │   │   │   ├── env-vars.ts
│   │   │   │   ├── docker.ts
│   │   │   │   ├── binaries.ts
│   │   │   │   └── lockfile.ts
│   │   │   ├── hash.ts           # Snapshot hashing
│   │   │   └── types.ts          # Type definitions
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── cli/                       # CLI tool
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── snapshot.ts   # Capture snapshot
│   │   │   │   ├── compare.ts    # Compare snapshots
│   │   │   │   ├── drift.ts      # Detect drift
│   │   │   │   ├── sync.ts       # Sync environments
│   │   │   │   ├── validate.ts   # CI/CD validation
│   │   │   │   └── doctor.ts     # Interactive fixer
│   │   │   ├── ui.ts             # Terminal UI
│   │   │   ├── reporter.ts       # Report generator
│   │   │   └── index.ts          # CLI entry
│   │   └── package.json
│   │
│   ├── sync/                      # Sync engine
│   │   ├── src/
│   │   │   ├── env-sync.ts       # Main sync orchestrator
│   │   │   ├── docker-sync.ts    # Docker sync
│   │   │   ├── dep-sync.ts       # Dependency sync
│   │   │   ├── env-var-sync.ts   # Env var sync
│   │   │   └── rollback.ts       # Rollback mechanism
│   │   └── package.json
│   │
│   └── ci-plugin/                 # CI/CD plugins
│       ├── src/
│       │   ├── github-action.ts
│       │   ├── gitlab-ci.ts
│       │   └── jenkins.ts
│       └── package.json
│
├── docs/
├── examples/
├── tests/
│   ├── fixtures/
│   └── integration/
├── package.json
└── README.md
```

---

## 🛠️ Development Setup

### Initial Setup
```bash
# Clone and install
git clone <repo-url>
cd envsync
npm install

# Build
npm run build

# Run tests
npm test

# Test CLI locally
npm link
envsync snapshot
```

### Essential Commands
```bash
# Development
npm run dev           # Watch mode
npm run test:watch    # Test watch mode

# Testing
npm test              # All tests
npm run test:int      # Integration tests
npm run test:e2e      # E2E tests

# Building
npm run build         # Production build
npm run clean         # Clean dist/

# CLI testing
envsync snapshot --save local.json
envsync compare local.json prod.json
envsync drift --environment production
envsync sync --auto-fix
```

---

## 📝 Coding Standards

### TypeScript Configuration
- **Target**: ES2022
- **Strict mode**: Enabled
- **No implicit any**: Enforced
- **Module**: ESNext with node resolution

### Code Style Rules

#### Environment Detection Pattern
```typescript
// ✅ CORRECT: Comprehensive environment detection
export async function detectEnvironment(): Promise<EnvironmentType> {
  // Check environment variable first
  const envVar = process.env.NODE_ENV?.toLowerCase();
  if (envVar === 'production') return 'production';
  if (envVar === 'staging') return 'staging';
  if (envVar === 'development') return 'local';
  
  // Check for CI environment
  if (process.env.CI === 'true') return 'ci';
  
  // Check Docker environment
  if (await isDockerEnvironment()) return 'docker';
  
  // Default to local
  return 'local';
}

// ❌ WRONG: Incomplete detection
function detectEnvironment() {
  return process.env.NODE_ENV || 'development';
}
```

#### Safe Sync Pattern
```typescript
// ✅ CORRECT: Explicit confirmation before modifying
export async function syncEnvironment(
  driftReport: DriftReport,
  options: SyncOptions
): Promise<SyncResult> {
  // Show what will be changed
  displaySyncPlan(driftReport);
  
  // Require confirmation unless --auto-fix
  if (!options.autoFix) {
    const confirmed = await confirm('Apply these changes?');
    if (!confirmed) {
      return { success: false, reason: 'User cancelled' };
    }
  }
  
  // Create rollback point
  const rollback = await createRollbackPoint();
  
  try {
    const result = await applySyncActions(driftReport);
    return result;
  } catch (error) {
    await rollback.restore();
    throw error;
  }
}

// ❌ WRONG: Modify without confirmation
async function syncEnvironment(drift: DriftReport) {
  await applySyncActions(drift); // Dangerous!
}
```

#### Cross-Platform Path Handling
```typescript
// ✅ CORRECT: Cross-platform compatible
import { join, normalize } from 'path';

function getNodeModulesPath(): string {
  return normalize(join(process.cwd(), 'node_modules'));
}

function findDockerfiles(): string[] {
  // Use forward slashes in glob patterns (works on all platforms)
  return glob.sync('**/Dockerfile*', {
    ignore: ['**/node_modules/**'],
  });
}

// ❌ WRONG: Hardcoded path separators
function getNodeModulesPath() {
  return process.cwd() + '/node_modules'; // Breaks on Windows
}
```

---

## 🔍 Feature Implementation Guides

### Feature 1: Environment Snapshot Capture

**Goal**: Capture complete environment state including Docker[449][450].

**Implementation steps**:

1. **Capture Node.js version**
```typescript
// packages/core/src/validators/node-version.ts
import { execSync } from 'child_process';

export async function captureNodeVersion(): Promise<NodeVersionInfo> {
  return {
    version: process.version,
    npmVersion: execSync('npm --version', { encoding: 'utf-8' }).trim(),
    platform: process.platform,
    arch: process.arch,
    v8Version: process.versions.v8,
    modules: process.versions.modules,  // ABI version
    openssl: process.versions.openssl,
  };
}
```

2. **Capture dependencies with lockfile**
```typescript
// packages/core/src/validators/dependencies.ts
import { readFileSync } from 'fs';
import { glob } from 'glob';

export async function captureDependencies(): Promise<DependencySnapshot> {
  const packageJson = JSON.parse(
    readFileSync('package.json', 'utf-8')
  );
  
  // Parse lockfile
  const lockfile = await parseLockfile();
  
  // Detect native modules
  const nativeModules = await detectNativeModules();
  
  return {
    production: packageJson.dependencies || {},
    development: packageJson.devDependencies || {},
    lockfileHash: hashLockfile(lockfile),
    nativeModules,
  };
}

async function detectNativeModules(): Promise<NativeModuleInfo[]> {
  // Find .node files (compiled native modules)
  const nodeFiles = await glob('node_modules/**/*.node');
  
  const modules: NativeModuleInfo[] = [];
  
  for (const file of nodeFiles) {
    const stats = await fs.stat(file);
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
  }
  
  return modules;
}
```

3. **Capture Docker configuration**
```typescript
// packages/core/src/validators/docker.ts
import Docker from 'dockerode';
import { readFileSync } from 'fs';
import YAML from 'yaml';

export async function captureDockerConfig(): Promise<DockerSnapshot> {
  const docker = new Docker();
  
  try {
    const version = await docker.version();
    const images = await docker.listImages();
    const containers = await docker.listContainers({ all: true });
    
    // Find and parse docker-compose files
    const composeFiles = await findDockerComposeFiles();
    const composeParsed = composeFiles.map(file => ({
      file,
      config: YAML.parse(readFileSync(file, 'utf-8')),
    }));
    
    return {
      version: version.Version,
      platform: version.Os,
      arch: version.Arch,
      images: images.map(img => ({
        id: img.Id.substring(0, 12),
        tags: img.RepoTags || [],
        size: img.Size,
      })),
      containers: containers.map(c => ({
        id: c.Id.substring(0, 12),
        name: c.Names[0],
        image: c.Image,
        state: c.State,
      })),
      composeConfigs: composeParsed.map(c => ({
        file: c.file,
        services: Object.keys(c.config.services || {}),
        networks: Object.keys(c.config.networks || {}),
        volumes: Object.keys(c.config.volumes || {}),
      })),
    };
  } catch (error) {
    // Docker not available
    return {
      version: null,
      platform: null,
      arch: null,
      images: [],
      containers: [],
      composeConfigs: [],
    };
  }
}
```

4. **Capture environment variables safely**
```typescript
// packages/core/src/validators/env-vars.ts
export function captureEnvVars(
  options: { redactSensitive?: boolean } = {}
): EnvironmentVariables {
  const sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /private[_-]?key/i,
    /database[_-]?url/i,
  ];
  
  const variables: Record<string, string> = {};
  const redacted: string[] = [];
  
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;
    
    const isSensitive = options.redactSensitive &&
      sensitivePatterns.some(p => p.test(key));
    
    if (isSensitive) {
      variables[key] = '[REDACTED]';
      redacted.push(key);
    } else {
      variables[key] = value;
    }
  }
  
  return { variables, redacted };
}
```

---

### Feature 2: Drift Detection

**Goal**: Compare environments and identify discrepancies[449][451][454].

**Implementation**:

1. **Compare dependencies**
```typescript
// packages/core/src/compare.ts
import semver from 'semver';

export function compareDependencies(
  local: DependencySnapshot,
  remote: DependencySnapshot
): Drift[] {
  const drifts: Drift[] = [];
  
  const allPackages = new Set([
    ...Object.keys(local.production),
    ...Object.keys(remote.production),
  ]);
  
  for (const pkg of allPackages) {
    const localVer = local.production[pkg];
    const remoteVer = remote.production[pkg];
    
    if (!localVer && remoteVer) {
      drifts.push({
        category: 'dependency',
        severity: 'high',
        field: `dependency.${pkg}`,
        local: undefined,
        remote: remoteVer,
        impact: 'Missing dependency may cause runtime errors',
        recommendation: `Install ${pkg}@${remoteVer}`,
      });
    } else if (localVer && !remoteVer) {
      drifts.push({
        category: 'dependency',
        severity: 'medium',
        field: `dependency.${pkg}`,
        local: localVer,
        remote: undefined,
        impact: 'Extra dependency not in remote',
        recommendation: `Remove ${pkg} or add to remote`,
      });
    } else if (localVer !== remoteVer) {
      const severity = assessVersionDrift(localVer, remoteVer);
      
      drifts.push({
        category: 'dependency',
        severity,
        field: `dependency.${pkg}`,
        local: localVer,
        remote: remoteVer,
        impact: describeVersionImpact(pkg, localVer, remoteVer),
        recommendation: `Update to ${remoteVer}`,
      });
    }
  }
  
  return drifts;
}

function assessVersionDrift(
  local: string,
  remote: string
): DriftSeverity {
  try {
    const localSem = semver.parse(local);
    const remoteSem = semver.parse(remote);
    
    if (!localSem || !remoteSem) return 'medium';
    
    if (localSem.major !== remoteSem.major) return 'high';
    if (localSem.minor !== remoteSem.minor) return 'medium';
    return 'low';
  } catch {
    return 'medium';
  }
}
```

2. **Compare native modules (binary compatibility)**
```typescript
function compareNativeModules(
  local: NativeModuleInfo[],
  remote: NativeModuleInfo[]
): Drift[] {
  const drifts: Drift[] = [];
  
  for (const localMod of local) {
    const remoteMod = remote.find(m => m.name === localMod.name);
    
    if (!remoteMod) continue;
    
    // Platform mismatch
    if (localMod.platform !== remoteMod.platform) {
      drifts.push({
        category: 'binary',
        severity: 'critical',
        field: `native.${localMod.name}.platform`,
        local: localMod.platform,
        remote: remoteMod.platform,
        impact: 'Binary compiled for wrong platform - will crash',
        recommendation: `Rebuild for ${remoteMod.platform}`,
      });
    }
    
    // Node.js ABI mismatch
    if (localMod.nodeAbi !== remoteMod.nodeAbi) {
      drifts.push({
        category: 'binary',
        severity: 'critical',
        field: `native.${localMod.name}.abi`,
        local: localMod.nodeAbi,
        remote: remoteMod.nodeAbi,
        impact: 'Incompatible Node.js ABI version',
        recommendation: 'Rebuild with matching Node.js version',
      });
    }
  }
  
  return drifts;
}
```

---

### Feature 3: Environment Synchronization

**Goal**: Fix drift with one-click sync[449][450].

**Implementation**:

```typescript
// packages/sync/src/env-sync.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class EnvironmentSync {
  async sync(
    driftReport: DriftReport,
    options: SyncOptions
  ): Promise<SyncResult> {
    const actions: SyncAction[] = [];
    
    // Group drifts by category
    const grouped = groupBy(driftReport.drifts, 'category');
    
    // Sync dependencies first
    if (grouped.dependency) {
      const depActions = await this.syncDependencies(
        grouped.dependency,
        options
      );
      actions.push(...depActions);
    }
    
    // Sync environment variables
    if (grouped.envvar) {
      const envActions = await this.syncEnvVars(
        grouped.envvar,
        options
      );
      actions.push(...envActions);
    }
    
    // Sync Docker config
    if (grouped.docker) {
      const dockerActions = await this.syncDocker(
        grouped.docker,
        options
      );
      actions.push(...dockerActions);
    }
    
    return {
      success: actions.every(a => a.success),
      actions,
      summary: this.summarize(actions),
    };
  }
  
  private async syncDependencies(
    drifts: Drift[],
    options: SyncOptions
  ): Promise<SyncAction[]> {
    const actions: SyncAction[] = [];
    
    for (const drift of drifts) {
      const pkg = drift.field.replace('dependency.', '');
      const targetVer = drift.remote as string;
      
      try {
        if (!targetVer) {
          // Remove package
          await execAsync(`npm uninstall ${pkg}`);
          actions.push({
            drift,
            success: true,
            action: `Removed ${pkg}`,
          });
        } else {
          // Install/update package
          await execAsync(`npm install ${pkg}@${targetVer} --save-exact`);
          actions.push({
            drift,
            success: true,
            action: `Updated ${pkg} to ${targetVer}`,
          });
        }
      } catch (error) {
        actions.push({
          drift,
          success: false,
          error: error.message,
        });
      }
    }
    
    return actions;
  }
}
```

---

## 🧪 Testing Requirements

### Test Coverage Rules
- **Core**: 85% minimum
- **CLI**: 80% minimum
- **Integration**: Test with Docker containers
- **E2E**: Full snapshot → drift → sync flow

### Test Structure
```typescript
// packages/core/tests/snapshot.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SnapshotCapture } from '../src/snapshot';

describe('SnapshotCapture', () => {
  let capture: SnapshotCapture;
  
  beforeEach(() => {
    capture = new SnapshotCapture();
  });
  
  describe('captureNodeVersion', () => {
    it('captures Node.js version correctly', async () => {
      const info = await capture.captureNodeVersion();
      
      expect(info.version).toMatch(/^v\d+\.\d+\.\d+$/);
      expect(info.platform).toBeDefined();
      expect(info.arch).toBeDefined();
    });
  });
  
  describe('detectNativeModules', () => {
    it('detects native modules', async () => {
      const modules = await capture.detectNativeModules();
      
      // Should find .node files if they exist
      for (const mod of modules) {
        expect(mod.path).toMatch(/\.node$/);
        expect(mod.platform).toBe(process.platform);
        expect(mod.nodeAbi).toBeDefined();
      }
    });
  });
});
```

---

## 🚨 Critical Rules

### 1. Never Modify Without Confirmation
```typescript
// ❌ NEVER auto-sync without permission
async function sync(drift: DriftReport) {
  await applySyncActions(drift);
}

// ✅ ALWAYS require confirmation
async function sync(drift: DriftReport, options: SyncOptions) {
  if (!options.autoFix) {
    const confirmed = await confirm('Apply changes?');
    if (!confirmed) return;
  }
  await applySyncActions(drift);
}
```

### 2. Handle Platform Differences
```typescript
// ❌ NEVER assume Unix paths
const path = './node_modules';

// ✅ ALWAYS use path.join
import { join } from 'path';
const path = join('.', 'node_modules');
```

### 3. Safe Docker Detection
```typescript
// ✅ Handle Docker unavailability gracefully
try {
  const docker = new Docker();
  const info = await docker.version();
} catch (error) {
  // Docker not available - return empty config
  return { version: null, images: [], containers: [] };
}
```

---

## 📖 Quick Command Reference

```bash
# Snapshot
envsync snapshot                      # Capture current env
envsync snapshot --save local.json    # Save to file

# Compare
envsync compare local.json prod.json
envsync compare local production      # Compare against live

# Drift detection
envsync drift                         # Compare with production
envsync drift --environment staging

# Sync
envsync sync                          # Interactive sync
envsync sync --auto-fix               # Auto-fix all drift
envsync sync --dry-run                # Show what would change

# Validation (CI/CD)
envsync validate --fail-on high       # Exit 1 if high-severity drift
```

---

## 🎯 Agent Success Criteria

An AI agent is successful on EnvSync when:

1. ✅ Snapshots capture complete environment state
2. ✅ Drift detection is accurate across platforms
3. ✅ Native module compatibility checked correctly
4. ✅ Sync never modifies without confirmation (unless --auto-fix)
5. ✅ Works on Windows, macOS, Linux
6. ✅ Docker detection handles unavailability gracefully
7. ✅ Test coverage > 85% for core
8. ✅ CI/CD integration works in GitHub Actions

---

*This file is read automatically by Claude Code and compatible AI coding agents. Keep it updated as the project evolves.*