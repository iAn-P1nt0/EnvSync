# @ian-p1nt0/envsync-core

Core detection engine for EnvSync - Environment Parity Validator.

## Overview

The core package provides the fundamental functionality for capturing environment snapshots and detecting drift between environments.

## Features

- **Environment Snapshot Capture**: Complete state capture including:
  - Node.js version and platform information
  - npm/yarn/pnpm dependencies with lockfile validation
  - Native binary modules (.node files) with ABI compatibility
  - Environment variables with sensitive data redaction
  - Docker images, containers, and compose configurations
  - System information

- **Drift Detection**: Comprehensive comparison with:
  - Semantic versioning analysis
  - Severity assessment (critical, high, medium, low)
  - Category-based grouping (nodejs, dependency, envvar, docker, binary)
  - Detailed impact and recommendation generation

- **Binary Compatibility**: Platform, architecture, and Node.js ABI validation

## Installation

```bash
npm install @ian-p1nt0/envsync-core
```

## Usage

```typescript
import { captureSnapshot, compareSnapshots } from '@ian-p1nt0/envsync-core';

// Capture environment snapshot
const snapshot = await captureSnapshot({
  redactSensitive: true,
  includeDocker: true,
  includeNativeModules: true,
});

// Compare two snapshots
const local = await captureSnapshot();
const remote = deserializeSnapshot(remoteSnapshotJson);
const report = compareSnapshots(local, remote);

console.log(`Drift detected: ${report.hasDrift}`);
console.log(`Severity: ${report.severity}`);
console.log(`Total issues: ${report.summary.total}`);
```

## API

### `captureSnapshot(options?): Promise<EnvironmentSnapshot>`

Captures a complete environment snapshot.

**Options:**
- `redactSensitive?: boolean` - Redact sensitive environment variables (default: true)
- `includeDocker?: boolean` - Include Docker information (default: true)
- `includeNativeModules?: boolean` - Include native modules (default: true)

### `compareSnapshots(local, remote): DriftReport`

Compares two environment snapshots and returns a drift report.

### `serializeSnapshot(snapshot): string`

Serializes a snapshot to JSON string.

### `deserializeSnapshot(data): EnvironmentSnapshot`

Deserializes a snapshot from JSON string.

## Part of EnvSync

This is the core package of the EnvSync ecosystem:

- **[@ian-p1nt0/envsync](https://www.npmjs.com/package/@ian-p1nt0/envsync)** - Main CLI tool
- **[@ian-p1nt0/envsync-core](https://www.npmjs.com/package/@ian-p1nt0/envsync-core)** - Core detection engine
- **[@ian-p1nt0/envsync-sync](https://www.npmjs.com/package/@ian-p1nt0/envsync-sync)** - Synchronization engine
- **[@ian-p1nt0/envsync-ci-plugin](https://www.npmjs.com/package/@ian-p1nt0/envsync-ci-plugin)** - CI/CD integrations

## License

MIT

## Repository

[https://github.com/iAn-P1nt0/EnvSync](https://github.com/iAn-P1nt0/EnvSync)
