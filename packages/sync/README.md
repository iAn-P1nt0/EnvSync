# @ian-p1nt0/envsync-sync

Environment synchronization engine for EnvSync.

## Overview

The sync package provides functionality for automatically synchronizing environments to fix detected drift.

## Features

- **One-Click Sync**: Automatically fix environment drift
- **Dry-Run Mode**: Preview changes before applying
- **Auto-Fix Capability**: Unattended synchronization
- **Rollback Mechanism**: Safety rollback for failed syncs
- **Category-Based Filtering**: Sync only specific categories
- **Safety Confirmations**: User confirmation before making changes

## Installation

```bash
npm install @ian-p1nt0/envsync-sync
```

## Usage

```typescript
import { EnvironmentSync } from '@ian-p1nt0/envsync-sync';
import { compareSnapshots } from '@ian-p1nt0/envsync-core';

// Get drift report from core package
const report = compareSnapshots(localSnapshot, remoteSnapshot);

// Create sync instance
const sync = new EnvironmentSync();

// Sync with options
const result = await sync.sync(report, {
  autoFix: false,      // Require confirmation
  dryRun: false,       // Actually apply changes
  categories: ['dependency', 'envvar'],  // Only sync these
});

console.log(`Succeeded: ${result.summary.succeeded}`);
console.log(`Failed: ${result.summary.failed}`);
```

## API

### `EnvironmentSync.sync(driftReport, options?): Promise<SyncResult>`

Synchronizes the local environment to match the remote.

**Options:**
- `autoFix?: boolean` - Auto-fix without confirmation (default: false)
- `dryRun?: boolean` - Preview changes only (default: false)
- `categories?: DriftCategory[]` - Only sync specific categories
- `maxSeverity?: DriftSeverity` - Only sync up to this severity

**Returns:**
- `SyncResult` with success status and action details

## Sync Actions

The sync engine can handle:

- **Dependencies**: Install/update/remove npm packages
- **Environment Variables**: Show required changes (manual intervention)
- **Docker**: Pull missing images
- **Native Modules**: Rebuild for compatibility
- **Node.js Version**: Show upgrade instructions (manual intervention)

## Safety Features

- User confirmation required by default
- Dry-run mode for previewing changes
- Rollback point creation
- Error handling with detailed messages
- Category and severity filtering

## Part of EnvSync

This is the synchronization package of the EnvSync ecosystem:

- **[@ian-p1nt0/envsync](https://www.npmjs.com/package/@ian-p1nt0/envsync)** - Main CLI tool
- **[@ian-p1nt0/envsync-core](https://www.npmjs.com/package/@ian-p1nt0/envsync-core)** - Core detection engine
- **[@ian-p1nt0/envsync-sync](https://www.npmjs.com/package/@ian-p1nt0/envsync-sync)** - Synchronization engine
- **[@ian-p1nt0/envsync-ci-plugin](https://www.npmjs.com/package/@ian-p1nt0/envsync-ci-plugin)** - CI/CD integrations

## License

MIT

## Repository

[https://github.com/iAn-P1nt0/EnvSync](https://github.com/iAn-P1nt0/EnvSync)
