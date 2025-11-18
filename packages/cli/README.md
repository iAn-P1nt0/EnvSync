# @ian-p1nt0/envsync

EnvSync - Environment Parity Validator CLI

> Eliminate "works on my machine" failures through proactive environment validation

## Overview

EnvSync is a comprehensive environment parity validator that detects and fixes drift between local development, staging, and production environments before deployment.

## Features

- 📸 **Environment Snapshots** - Capture complete environment state
- 🔍 **Drift Detection** - Compare local vs staging vs production
- ⚙️ **Binary Compatibility** - Check native Node.js modules across platforms
- 🔄 **One-Click Sync** - Automatically fix detected drift
- 🐳 **Docker Integration** - Align Docker configs across environments
- 🚀 **CI/CD Ready** - Validate in pipeline before deployment
- 📊 **Beautiful Reports** - Export drift analysis as JSON/HTML

## Installation

### Global Installation (Recommended)

```bash
npm install -g @ian-p1nt0/envsync
```

### Project Installation

```bash
npm install --save-dev @ian-p1nt0/envsync
```

## Quick Start

```bash
# Capture environment snapshot
envsync snapshot --save local.snapshot.json

# Compare environments
envsync compare local.snapshot.json production.snapshot.json

# Detect drift
envsync drift --environment production --detailed

# Interactive health check
envsync doctor

# Sync environments
envsync sync --auto-fix

# CI/CD validation
envsync validate --fail-on high
```

## Commands

### `envsync snapshot`

Capture current environment snapshot.

```bash
envsync snapshot --save local.snapshot.json
```

### `envsync compare`

Compare two environment snapshots.

```bash
envsync compare local.snapshot.json production.snapshot.json --detailed
```

### `envsync drift`

Detect drift against remote environment.

```bash
envsync drift --environment production --fail-on high
```

### `envsync sync`

Synchronize local environment to match remote.

```bash
envsync sync --auto-fix
envsync sync --dry-run
```

### `envsync validate`

Validate environment for CI/CD (exits with code 1 on failure).

```bash
envsync validate --fail-on high
```

### `envsync doctor`

Interactive environment health check and fixer.

```bash
envsync doctor
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Validate Environment
  run: |
    npm install -g @ian-p1nt0/envsync
    envsync validate --fail-on high
```

### GitLab CI

```yaml
environment-validation:
  script:
    - npm install -g @ian-p1nt0/envsync
    - envsync validate --fail-on high
```

## Example Output

```
Drift Detection Summary
━━━━━━━━━━━━━━━━━━━━━━━

Overall Severity: HIGH

┌──────────┬───────┐
│ Severity │ Count │
├──────────┼───────┤
│ CRITICAL │     0 │
│ HIGH     │     2 │
│ MEDIUM   │     3 │
│ LOW      │     1 │
└──────────┴───────┘

┌────────────┬────────┐
│  Category  │ Issues │
├────────────┼────────┤
│ ⬢ nodejs   │      1 │
│ 📦 dependency │   4 │
│ 🐳 docker     │   1 │
└────────────┴────────┘
```

## Part of EnvSync

This is the main CLI package of the EnvSync ecosystem:

- **[@ian-p1nt0/envsync](https://www.npmjs.com/package/@ian-p1nt0/envsync)** - Main CLI tool ⭐
- **[@ian-p1nt0/envsync-core](https://www.npmjs.com/package/@ian-p1nt0/envsync-core)** - Core detection engine
- **[@ian-p1nt0/envsync-sync](https://www.npmjs.com/package/@ian-p1nt0/envsync-sync)** - Synchronization engine
- **[@ian-p1nt0/envsync-ci-plugin](https://www.npmjs.com/package/@ian-p1nt0/envsync-ci-plugin)** - CI/CD integrations

## License

MIT

## Repository

[https://github.com/iAn-P1nt0/EnvSync](https://github.com/iAn-P1nt0/EnvSync)

## Issues & Support

[https://github.com/iAn-P1nt0/EnvSync/issues](https://github.com/iAn-P1nt0/EnvSync/issues)
