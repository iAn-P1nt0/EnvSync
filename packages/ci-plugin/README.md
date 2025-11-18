# @ian-p1nt0/envsync-ci-plugin

CI/CD integration plugins for EnvSync.

## Overview

The CI plugin package provides integration functionality for running EnvSync validation in CI/CD pipelines.

## Features

- **GitHub Actions Integration**: Native GitHub Actions support
- **GitLab CI Integration**: Native GitLab CI support
- **Exit Codes**: Proper exit codes based on severity
- **Detailed Annotations**: Issue annotations in CI logs
- **Configurable Thresholds**: Fail on specific severity levels

## Installation

```bash
npm install @ian-p1nt0/envsync-ci-plugin
```

## Usage

### GitHub Actions

```typescript
import { runGitHubAction } from '@ian-p1nt0/envsync-ci-plugin';

await runGitHubAction({
  baselineSnapshot: 'production.snapshot.json',
  failOn: 'high',
});
```

**Workflow Example:**

```yaml
name: Environment Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm install -g @ian-p1nt0/envsync
      - run: envsync validate --fail-on high
```

### GitLab CI

```typescript
import { runGitLabCI } from '@ian-p1nt0/envsync-ci-plugin';

await runGitLabCI({
  baselineSnapshot: 'production.snapshot.json',
  failOn: 'high',
});
```

**Pipeline Example:**

```yaml
environment-validation:
  stage: test
  image: node:18
  script:
    - npm install -g @ian-p1nt0/envsync
    - envsync validate --fail-on high
  only:
    - merge_requests
    - main
```

## API

### `runGitHubAction(options): Promise<void>`

Runs EnvSync validation in GitHub Actions.

**Options:**
- `baselineSnapshot: string` - Path to baseline snapshot file
- `failOn?: 'critical' | 'high' | 'medium' | 'low'` - Fail threshold (default: 'high')

### `runGitLabCI(options): Promise<void>`

Runs EnvSync validation in GitLab CI.

**Options:**
- `baselineSnapshot: string` - Path to baseline snapshot file
- `failOn?: 'critical' | 'high' | 'medium' | 'low'` - Fail threshold (default: 'high')

## CI Output Features

### GitHub Actions
- Formatted output groups
- Error/warning annotations
- Set output variables (has_drift, severity, total_issues)
- Proper exit codes

### GitLab CI
- Formatted console output
- Colored severity levels
- Detailed drift lists
- Proper exit codes

## Part of EnvSync

This is the CI/CD integration package of the EnvSync ecosystem:

- **[@ian-p1nt0/envsync](https://www.npmjs.com/package/@ian-p1nt0/envsync)** - Main CLI tool
- **[@ian-p1nt0/envsync-core](https://www.npmjs.com/package/@ian-p1nt0/envsync-core)** - Core detection engine
- **[@ian-p1nt0/envsync-sync](https://www.npmjs.com/package/@ian-p1nt0/envsync-sync)** - Synchronization engine
- **[@ian-p1nt0/envsync-ci-plugin](https://www.npmjs.com/package/@ian-p1nt0/envsync-ci-plugin)** - CI/CD integrations

## License

MIT

## Repository

[https://github.com/iAn-P1nt0/EnvSync](https://github.com/iAn-P1nt0/EnvSync)
