# CLAUDE.md - EnvSync Development Guide

**Project**: EnvSync - Environment Parity Validator  
**Purpose**: Eliminate "works on my machine" failures through proactive environment validation  
**Target**: TypeScript npm CLI tool + Library  
**Repository**: envsync (npm package name)

---

## 🎯 Project Mission

EnvSync is a comprehensive environment parity validator that detects and fixes drift between local development, staging, and production environments before deployment. It addresses the #1 deployment failure cause: environment discrepancies that lead to "works on my machine" bugs[449][450][452][455].

**Core Problem**: Environment drift causes silent failures - dependencies, Node.js versions, environment variables, and Docker configurations diverge between environments, leading to production incidents and wasted debugging time[398][403][449][452].

---

## 📋 Core Requirements

### Detection & Analysis
- **Environment snapshots**: Capture complete environment state (dependencies, Node versions, env vars, Docker config)[449][450]
- **Drift detection**: Compare local vs staging vs production environments[451][454]
- **Binary compatibility**: Check native Node.js modules across platforms[443][447]
- **Dependency lock validation**: Ensure package-lock.json consistency[403][405]
- **Node.js version validation**: Detect version mismatches across environments[446][447][450]

### Synchronization & Remediation
- **Visual diff tool**: Show exact discrepancies between environments[449][452]
- **One-click sync**: Automatically fix detected drift[449][450]
- **Docker environment sync**: Align Docker configs across environments[440][446][449][450]
- **CI/CD integration**: Validate in pipeline before deployment[449][450][453]

### Usability & Reporting
- **Interactive CLI**: Beautiful terminal UI with clear actionable insights[452]
- **Detailed reports**: Export drift analysis as JSON/HTML[451][454]
- **Proactive alerts**: Warn before deployment if drift detected[451][454]
- **Rollback capability**: Restore previous environment state if needed[451]

---

## 🏗️ Project Architecture

```
envsync/
├── packages/
│   ├── core/                   # Core detection engine
│   │   ├── src/
│   │   │   ├── snapshot.ts     # Environment snapshot capture
│   │   │   ├── compare.ts      # Drift detection logic
│   │   │   ├── validators/     # Environment validators
│   │   │   │   ├── node-version.ts
│   │   │   │   ├── dependencies.ts
│   │   │   │   ├── env-vars.ts
│   │   │   │   ├── docker.ts
│   │   │   │   └── binaries.ts
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   ├── cli/                    # CLI interface
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── snapshot.ts
│   │   │   │   ├── compare.ts
│   │   │   │   ├── sync.ts
│   │   │   │   └── validate.ts
│   │   │   ├── ui.ts          # Terminal UI
│   │   │   └── reporter.ts    # Report generator
│   │   └── package.json
│   │
│   ├── sync/                   # Environment sync engine
│   │   ├── src/
│   │   │   ├── docker-sync.ts
│   │   │   ├── dep-sync.ts
│   │   │   └── env-sync.ts
│   │   └── package.json
│   │
│   └── ci-plugin/              # CI/CD integrations
│       ├── src/
│       │   ├── github-action.ts
│       │   ├── gitlab-ci.ts
│       │   └── jenkins.ts
│       └── package.json
│
├── docs/
├── examples/
├── tests/
└── README.md
```

---

## 🛠️ Development Environment

### Required Tools
- **Node.js**: 18+ (for native test runner, fetch)
- **Package Manager**: npm/yarn/pnpm
- **TypeScript**: 5.3+
- **Build Tool**: tsup (fast esbuild-based)
- **Test Runner**: Vitest
- **Docker**: 24+ (for Docker validation features)

### Essential Dependencies
```json
{
  "dependencies": {
    "commander": "^11.0.0",
    "chalk": "^5.0.0",
    "ora": "^7.0.0",
    "cli-table3": "^0.6.3",
    "semver": "^7.5.0",
    "dockerode": "^4.0.0",
    "dotenv": "^16.0.0",
    "fast-diff": "^1.3.0",
    "glob": "^10.0.0"
  }
}
```

---

## 💻 Coding Standards

### TypeScript Configuration
- **Strict mode**: Enabled
- **Target**: ES2022
- **Module**: ESNext with node resolution
- **Strict null checks**: Enabled

### Code Patterns

#### Snapshot Capture Pattern
```typescript
// ✅ CORRECT: Comprehensive snapshot with metadata
export interface EnvironmentSnapshot {
  timestamp: Date;
  environment: 'local' | 'staging' | 'production';
  nodeVersion: string;
  npmVersion: string;
  dependencies: DependencySnapshot;
  envVars: EnvironmentVariables;
  docker: DockerSnapshot;
  system: SystemInfo;
  hash: string;  // For quick comparison
}

async function captureSnapshot(): Promise<EnvironmentSnapshot> {
  const [nodeInfo, deps, envVars, dockerInfo, sysInfo] = await Promise.all([
    captureNodeVersion(),
    captureDependencies(),
    captureEnvVars(),
    captureDockerConfig(),
    captureSystemInfo(),
  ]);
  
  const snapshot: EnvironmentSnapshot = {
    timestamp: new Date(),
    environment: detectEnvironment(),
    nodeVersion: nodeInfo.version,
    npmVersion: nodeInfo.npmVersion,
    dependencies: deps,
    envVars,
    docker: dockerInfo,
    system: sysInfo,
    hash: '', // Will be computed
  };
  
  snapshot.hash = hashSnapshot(snapshot);
  return snapshot;
}

// ❌ WRONG: Incomplete snapshot
async function captureSnapshot() {
  return {
    nodeVersion: process.version,
    // Missing: dependencies, env vars, Docker, etc.
  };
}
```

---

## 🔍 Core Functionality Details

### 1. Environment Snapshot Capture

**Purpose**: Capture complete environment state for comparison[449][450][452].

**Implementation**:
```typescript
// packages/core/src/snapshot.ts
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import Docker from 'dockerode';

export interface DependencySnapshot {
  packages: Record<string, string>;
  lockfile: LockfileSnapshot;
  nativeModules: NativeModuleInfo[];
}

export interface DockerSnapshot {
  version: string;
  images: DockerImage[];
  containers: DockerContainer[];
  composeFiles: DockerComposeConfig[];
}

export class SnapshotCapture {
  /**
   * Capture Node.js version and configuration
   */
  async captureNodeVersion(): Promise<NodeVersionInfo> {
    const nodeVersion = process.version;
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    const platform = process.platform;
    const arch = process.arch;
    
    return {
      nodeVersion,
      npmVersion,
      platform,
      arch,
      v8Version: process.versions.v8,
      modules: process.versions.modules,
    };
  }
  
  /**
   * Capture all dependencies from package.json and lockfile
   */
  async captureDependencies(): Promise<DependencySnapshot> {
    const packageJson = JSON.parse(
      readFileSync('package.json', 'utf-8')
    );
    
    const lockfile = this.parseLockfile();
    const nativeModules = await this.detectNativeModules();
    
    return {
      packages: {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      },
      lockfile,
      nativeModules,
    };
  }
  
  /**
   * Detect native Node.js modules that require binary compilation
   */
  private async detectNativeModules(): Promise<NativeModuleInfo[]> {
    const nativeModules: NativeModuleInfo[] = [];
    
    // Check node_modules for .node files
    const nodeFiles = await glob('node_modules/**/*.node');
    
    for (const file of nodeFiles) {
      const moduleName = this.extractModuleName(file);
      const fileInfo = await this.getFileInfo(file);
      
      nativeModules.push({
        name: moduleName,
        path: file,
        platform: process.platform,
        arch: process.arch,
        nodeAbi: process.versions.modules,
        size: fileInfo.size,
        modified: fileInfo.mtime,
      });
    }
    
    return nativeModules;
  }
  
  /**
   * Capture environment variables (with sensitive data redaction)
   */
  async captureEnvVars(): Promise<EnvironmentVariables> {
    const envVars: EnvironmentVariables = {
      variables: {},
      redacted: [],
    };
    
    const sensitiveKeys = [
      'API_KEY', 'SECRET', 'PASSWORD', 'TOKEN',
      'AWS_SECRET', 'PRIVATE_KEY', 'DATABASE_URL',
    ];
    
    for (const [key, value] of Object.entries(process.env)) {
      if (value === undefined) continue;
      
      const isSensitive = sensitiveKeys.some(s => 
        key.toUpperCase().includes(s)
      );
      
      if (isSensitive) {
        envVars.variables[key] = '[REDACTED]';
        envVars.redacted.push(key);
      } else {
        envVars.variables[key] = value;
      }
    }
    
    return envVars;
  }
  
  /**
   * Capture Docker configuration and state
   */
  async captureDockerConfig(): Promise<DockerSnapshot> {
    const docker = new Docker();
    
    try {
      const version = await docker.version();
      const images = await docker.listImages();
      const containers = await docker.listContainers({ all: true });
      
      // Parse docker-compose files
      const composeFiles = await this.parseDockerCompose();
      
      return {
        version: version.Version,
        images: images.map(img => ({
          id: img.Id,
          tags: img.RepoTags || [],
          created: new Date(img.Created * 1000),
          size: img.Size,
        })),
        containers: containers.map(c => ({
          id: c.Id,
          name: c.Names[0],
          image: c.Image,
          state: c.State,
          ports: c.Ports,
        })),
        composeFiles,
      };
    } catch (error) {
      // Docker not available
      return {
        version: 'N/A',
        images: [],
        containers: [],
        composeFiles: [],
      };
    }
  }
  
  /**
   * Parse docker-compose.yml files
   */
  private async parseDockerCompose(): Promise<DockerComposeConfig[]> {
    const composeFiles = await glob('**/docker-compose*.{yml,yaml}');
    const configs: DockerComposeConfig[] = [];
    
    for (const file of composeFiles) {
      const content = readFileSync(file, 'utf-8');
      const parsed = YAML.parse(content);
      
      configs.push({
        file,
        version: parsed.version,
        services: Object.keys(parsed.services || {}),
        networks: Object.keys(parsed.networks || {}),
        volumes: Object.keys(parsed.volumes || {}),
      });
    }
    
    return configs;
  }
}
```

---

### 2. Drift Detection Engine

**Purpose**: Compare environments and detect discrepancies[449][451][454].

**Implementation**:
```typescript
// packages/core/src/compare.ts
export interface DriftReport {
  hasDrift: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  drifts: Drift[];
  summary: DriftSummary;
}

export interface Drift {
  category: DriftCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  field: string;
  local: unknown;
  remote: unknown;
  impact: string;
  recommendation: string;
}

export class DriftDetector {
  /**
   * Compare two environment snapshots
   */
  compare(
    local: EnvironmentSnapshot,
    remote: EnvironmentSnapshot
  ): DriftReport {
    const drifts: Drift[] = [];
    
    // Node.js version drift
    if (local.nodeVersion !== remote.nodeVersion) {
      drifts.push({
        category: 'nodejs',
        severity: this.assessNodeVersionDrift(
          local.nodeVersion,
          remote.nodeVersion
        ),
        field: 'nodeVersion',
        local: local.nodeVersion,
        remote: remote.nodeVersion,
        impact: 'Runtime behavior differences, potential API incompatibilities',
        recommendation: `Update local Node.js to ${remote.nodeVersion}`,
      });
    }
    
    // Dependency drift
    const depDrifts = this.compareDependencies(
      local.dependencies,
      remote.dependencies
    );
    drifts.push(...depDrifts);
    
    // Environment variable drift
    const envDrifts = this.compareEnvVars(
      local.envVars,
      remote.envVars
    );
    drifts.push(...envDrifts);
    
    // Docker configuration drift
    const dockerDrifts = this.compareDocker(
      local.docker,
      remote.docker
    );
    drifts.push(...dockerDrifts);
    
    // Assess overall severity
    const severity = this.assessOverallSeverity(drifts);
    
    return {
      hasDrift: drifts.length > 0,
      severity,
      drifts,
      summary: this.generateSummary(drifts),
    };
  }
  
  /**
   * Compare dependencies between environments
   */
  private compareDependencies(
    local: DependencySnapshot,
    remote: DependencySnapshot
  ): Drift[] {
    const drifts: Drift[] = [];
    
    // Check for version mismatches
    for (const [pkg, localVer] of Object.entries(local.packages)) {
      const remoteVer = remote.packages[pkg];
      
      if (!remoteVer) {
        drifts.push({
          category: 'dependency',
          severity: 'medium',
          field: `package.${pkg}`,
          local: localVer,
          remote: undefined,
          impact: 'Package exists locally but not in remote',
          recommendation: `Add ${pkg}@${localVer} to remote environment`,
        });
        continue;
      }
      
      if (localVer !== remoteVer) {
        const severit = this.assessVersionDrift(localVer, remoteVer);
        
        drifts.push({
          category: 'dependency',
          severity,
          field: `package.${pkg}`,
          local: localVer,
          remote: remoteVer,
          impact: this.describeVersionImpact(pkg, localVer, remoteVer),
          recommendation: `Update ${pkg} to ${remoteVer}`,
        });
      }
    }
    
    // Check for missing dependencies
    for (const [pkg, remoteVer] of Object.entries(remote.packages)) {
      if (!local.packages[pkg]) {
        drifts.push({
          category: 'dependency',
          severity: 'high',
          field: `package.${pkg}`,
          local: undefined,
          remote: remoteVer,
          impact: 'Missing dependency - may cause runtime errors',
          recommendation: `Install ${pkg}@${remoteVer}`,
        });
      }
    }
    
    // Check native module compatibility
    const nativeDrifts = this.compareNativeModules(
      local.nativeModules,
      remote.nativeModules
    );
    drifts.push(...nativeDrifts);
    
    return drifts;
  }
  
  /**
   * Compare native modules for binary compatibility
   */
  private compareNativeModules(
    local: NativeModuleInfo[],
    remote: NativeModuleInfo[]
  ): Drift[] {
    const drifts: Drift[] = [];
    
    for (const localMod of local) {
      const remoteMod = remote.find(m => m.name === localMod.name);
      
      if (!remoteMod) continue;
      
      // Check platform compatibility
      if (localMod.platform !== remoteMod.platform) {
        drifts.push({
          category: 'binary',
          severity: 'critical',
          field: `native.${localMod.name}.platform`,
          local: localMod.platform,
          remote: remoteMod.platform,
          impact: 'Native module compiled for different platform - will fail',
          recommendation: `Rebuild ${localMod.name} for ${remoteMod.platform}`,
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
          impact: 'Incompatible Node.js ABI - module will fail to load',
          recommendation: `Rebuild ${localMod.name} with Node.js ${remoteMod.nodeVersion}`,
        });
      }
    }
    
    return drifts;
  }
  
  /**
   * Assess severity of version drift
   */
  private assessVersionDrift(
    local: string,
    remote: string
  ): 'low' | 'medium' | 'high' {
    try {
      const localSemver = semver.parse(local);
      const remoteSemver = semver.parse(remote);
      
      if (!localSemver || !remoteSemver) return 'medium';
      
      // Major version difference = high severity
      if (localSemver.major !== remoteSemver.major) {
        return 'high';
      }
      
      // Minor version difference = medium severity
      if (localSemver.minor !== remoteSemver.minor) {
        return 'medium';
      }
      
      // Patch version difference = low severity
      return 'low';
    } catch {
      return 'medium';
    }
  }
}
```

---

### 3. Environment Synchronization

**Purpose**: Fix drift automatically with one-click sync[449][450].

**Implementation**:
```typescript
// packages/sync/src/env-sync.ts
export class EnvironmentSync {
  /**
   * Sync local environment to match remote
   */
  async sync(
    driftReport: DriftReport,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const results: SyncAction[] = [];
    
    for (const drift of driftReport.drifts) {
      try {
        const action = await this.resolveDrift(drift, options);
        results.push(action);
      } catch (error) {
        results.push({
          drift,
          success: false,
          error: error.message,
        });
      }
    }
    
    return {
      success: results.every(r => r.success),
      actions: results,
      summary: this.summarize(results),
    };
  }
  
  /**
   * Resolve individual drift
   */
  private async resolveDrift(
    drift: Drift,
    options: SyncOptions
  ): Promise<SyncAction> {
    switch (drift.category) {
      case 'nodejs':
        return this.syncNodeVersion(drift, options);
      
      case 'dependency':
        return this.syncDependency(drift, options);
      
      case 'envvar':
        return this.syncEnvVar(drift, options);
      
      case 'docker':
        return this.syncDocker(drift, options);
      
      case 'binary':
        return this.syncNativeModule(drift, options);
      
      default:
        throw new Error(`Unknown drift category: ${drift.category}`);
    }
  }
  
  /**
   * Sync dependency version
   */
  private async syncDependency(
    drift: Drift,
    options: SyncOptions
  ): Promise<SyncAction> {
    const pkgName = drift.field.replace('package.', '');
    const targetVersion = drift.remote as string;
    
    if (!targetVersion) {
      // Package should be removed
      await this.exec(`npm uninstall ${pkgName}`);
      return {
        drift,
        success: true,
        action: `Removed ${pkgName}`,
      };
    }
    
    // Install specific version
    await this.exec(`npm install ${pkgName}@${targetVersion}`);
    
    return {
      drift,
      success: true,
      action: `Updated ${pkgName} to ${targetVersion}`,
    };
  }
  
  /**
   * Sync Docker configuration
   */
  private async syncDocker(
    drift: Drift,
    options: SyncOptions
  ): Promise<SyncAction> {
    // This would involve updating docker-compose.yml
    // or Dockerfile to match remote configuration
    
    // Implementation depends on specific drift type
    return {
      drift,
      success: true,
      action: 'Docker config synchronized',
    };
  }
}
```

---

## 🎨 CLI Design

### Command Structure
```bash
# Capture environment snapshot
envsync snapshot [--save <file>]

# Compare environments
envsync compare <local-snapshot> <remote-snapshot>
envsync compare local production  # Compare against live env

# Detect drift
envsync drift --environment production

# Sync environments
envsync sync --from production --to local
envsync sync --auto-fix  # Automatically fix all drift

# Validate before deployment
envsync validate --fail-on high  # Fail CI if high-severity drift

# Interactive mode
envsync doctor  # Interactive drift detection and fixing
```

### CLI Features
- **Color-coded output**: Red (critical), yellow (warning), green (OK)
- **Progress indicators**: Ora spinners for long operations
- **Interactive tables**: cli-table3 for drift comparison
- **Visual diffs**: Side-by-side comparison of configurations

---

## 🧪 Testing Standards

### Test Coverage
- **Minimum**: 85% for core, 80% for CLI
- **Integration tests**: Test with real environments (Docker containers)
- **E2E tests**: Full workflow from snapshot to sync

---

## 🚨 Critical Design Decisions

### 1. Snapshot Storage
**Decision**: Store snapshots as JSON with optional compression.
**Rationale**: Human-readable, easy to version control, widely supported.

### 2. Drift Severity Assessment
**Decision**: Use semantic versioning + impact analysis for severity.
**Rationale**: Major version changes = high severity, patches = low severity.

### 3. Sync Strategy
**Decision**: Explicit user confirmation before sync (unless --auto-fix).
**Rationale**: Safety - don't modify environment without permission.

---

*Last Updated: November 2025*
*For questions, consult AGENTS.md or repository maintainer.*