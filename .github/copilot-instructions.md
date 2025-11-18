# copilot-instructions.md - GitHub Copilot Instructions for EnvSync

**Project**: EnvSync - Environment Parity Validator  
**Tech Stack**: TypeScript, Node.js, Commander.js, Docker  
**Purpose**: Detect and fix environment drift between dev/staging/prod

---

## Project Context

EnvSync is a CLI tool that solves the "works on my machine" problem by:
- Capturing environment snapshots (Node version, deps, env vars, Docker config)
- Comparing local vs remote environments to detect drift
- Auto-syncing environments with one command
- Validating binary compatibility for native Node.js modules

**Key Files:**
- `packages/core/src/snapshot.ts` - Environment capture logic
- `packages/core/src/compare.ts` - Drift detection engine
- `packages/sync/src/env-sync.ts` - Environment synchronization
- `packages/cli/src/commands/*` - CLI commands

---

## Code Generation Guidelines

### When generating snapshot capture code:

```typescript
// ALWAYS capture complete environment state
interface EnvironmentSnapshot {
  timestamp: Date;
  nodeVersion: string;
  npmVersion: string;
  dependencies: Record<string, string>;
  envVars: Record<string, string>;
  docker: DockerConfig;
  nativeModules: NativeModuleInfo[];
}

// ALWAYS use cross-platform paths
import { join } from 'path';
const modulesPath = join(process.cwd(), 'node_modules');

// ALWAYS handle Docker unavailability
try {
  const docker = new Docker();
  const version = await docker.version();
} catch (error) {
  return { version: null, images: [], containers: [] };
}
```

### When generating drift detection code:

```typescript
// ALWAYS assess severity based on semantic versioning
function assessVersionDrift(local: string, remote: string): Severity {
  const localSem = semver.parse(local);
  const remoteSem = semver.parse(remote);
  
  if (localSem.major !== remoteSem.major) return 'high';
  if (localSem.minor !== remoteSem.minor) return 'medium';
  return 'low';
}

// ALWAYS provide actionable recommendations
const drift: Drift = {
  category: 'dependency',
  severity: 'high',
  field: `package.${pkg}`,
  local: '1.0.0',
  remote: '2.0.0',
  impact: 'Breaking changes may cause runtime errors',
  recommendation: `Update ${pkg} to version 2.0.0 and test thoroughly`,
};
```

### When generating sync code:

```typescript
// NEVER modify environment without confirmation
async function sync(drift: DriftReport, options: SyncOptions) {
  if (!options.autoFix) {
    const confirmed = await confirm('Apply these changes?');
    if (!confirmed) return { success: false, reason: 'Cancelled' };
  }
  
  // Create rollback point before changes
  const rollback = await createRollbackPoint();
  
  try {
    await applySyncActions(drift);
  } catch (error) {
    await rollback.restore();
    throw error;
  }
}

// ALWAYS use --save-exact for dependencies
await execAsync(`npm install ${pkg}@${version} --save-exact`);
```

### When generating CLI commands:

```typescript
// ALWAYS use Commander.js patterns
import { Command } from 'commander';

const program = new Command();

program
  .command('snapshot')
  .description('Capture environment snapshot')
  .option('-s, --save <file>', 'Save snapshot to file')
  .option('-e, --environment <env>', 'Environment name', 'local')
  .action(async (options) => {
    const snapshot = await captureSnapshot();
    if (options.save) {
      await fs.writeFile(options.save, JSON.stringify(snapshot, null, 2));
    }
  });

// ALWAYS provide clear, actionable output
import chalk from 'chalk';
import ora from 'ora';

const spinner = ora('Capturing environment...').start();
const snapshot = await captureSnapshot();
spinner.succeed('Environment captured');

if (drift.severity === 'high') {
  console.log(chalk.red(`⚠️  High severity drift detected`));
}
```

### When generating Docker integration:

```typescript
// ALWAYS handle Docker daemon connection errors
import Docker from 'dockerode';

async function getDockerInfo(): Promise<DockerInfo | null> {
  try {
    const docker = new Docker();
    const version = await docker.version();
    return {
      version: version.Version,
      images: await docker.listImages(),
      containers: await docker.listContainers({ all: true }),
    };
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ECONNREFUSED') {
      return null; // Docker not running
    }
    throw error;
  }
}

// ALWAYS parse docker-compose.yml safely
import YAML from 'yaml';

async function parseDockerCompose(file: string): Promise<ComposeConfig> {
  try {
    const content = await fs.readFile(file, 'utf-8');
    return YAML.parse(content);
  } catch (error) {
    console.warn(`Failed to parse ${file}:`, error.message);
    return { services: {}, networks: {}, volumes: {} };
  }
}
```

### When generating tests:

```typescript
// ALWAYS test cross-platform scenarios
describe('SnapshotCapture', () => {
  it('captures environment on Windows', async () => {
    if (process.platform !== 'win32') return;
    
    const snapshot = await captureSnapshot();
    expect(snapshot.platform).toBe('win32');
    expect(snapshot.nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/);
  });
  
  it('handles missing Docker gracefully', async () => {
    const snapshot = await captureSnapshot();
    
    // Should not throw even if Docker unavailable
    expect(snapshot.docker).toBeDefined();
    expect(snapshot.docker.version).toBeTypeOf('string');
  });
});

// ALWAYS use fixtures for integration tests
describe('DriftDetection', () => {
  it('detects dependency version drift', async () => {
    const local = loadFixture('snapshots/local-v1.json');
    const remote = loadFixture('snapshots/prod-v2.json');
    
    const drifts = compareDependencies(local.deps, remote.deps);
    
    expect(drifts).toHaveLength(1);
    expect(drifts[0].severity).toBe('high');
  });
});
```

---

## Common Patterns

### Environment Detection
```typescript
function detectEnvironment(): EnvironmentType {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'staging') return 'staging';
  if (process.env.CI === 'true') return 'ci';
  if (isDockerEnvironment()) return 'docker';
  return 'local';
}
```

### Native Module Detection
```typescript
async function detectNativeModules(): Promise<NativeModuleInfo[]> {
  const nodeFiles = await glob('node_modules/**/*.node');
  
  return nodeFiles.map(file => ({
    name: extractModuleName(file),
    path: file,
    platform: process.platform,
    arch: process.arch,
    nodeAbi: process.versions.modules,
  }));
}
```

### Lockfile Validation
```typescript
function validateLockfile(): LockfileValidation {
  const lockHash = hashFile('package-lock.json');
  const expectedHash = getExpectedHash();
  
  return {
    valid: lockHash === expectedHash,
    localHash: lockHash,
    expectedHash,
    recommendation: lockHash !== expectedHash 
      ? 'Run npm ci to sync lockfile' 
      : null,
  };
}
```

---

## What NOT to Generate

❌ Don't hardcode file paths (use `path.join`)
❌ Don't assume Docker is always available
❌ Don't modify environment without user confirmation
❌ Don't ignore Windows compatibility
❌ Don't use `npm install` without `--save-exact`
❌ Don't capture sensitive env vars without redaction
❌ Don't throw errors on missing dependencies (graceful degradation)

---

## Preferred Libraries

- **CLI**: `commander` for commands, `chalk` for colors, `ora` for spinners
- **Docker**: `dockerode` for Docker API
- **YAML**: `yaml` for parsing docker-compose.yml
- **Diff**: `fast-diff` for visual diffs
- **Glob**: `glob` for file searching
- **Versioning**: `semver` for version comparison

---

## Testing Requirements

- Test on Windows, macOS, Linux (use GitHub Actions matrix)
- Mock Docker API calls (don't require Docker in CI)
- Use fixtures for snapshot comparisons
- Test error cases (missing files, invalid JSON, etc.)

---

## CI/CD Integration Patterns

### GitHub Actions
```yaml
- name: Validate environment
  run: |
    npm install -g envsync
    envsync snapshot --save ci-snapshot.json
    envsync compare ci-snapshot.json production.json --fail-on high
```

### GitLab CI
```yaml
validate-env:
  script:
    - npm install -g envsync
    - envsync drift --environment production --fail-on medium
```

---

*This file provides GitHub Copilot with project-specific context for better code suggestions.*