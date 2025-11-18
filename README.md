# EnvSync - Environment Parity Validator

[![npm version](https://img.shields.io/npm/v/envsync.svg)](https://www.npmjs.com/package/envsync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Eliminate "works on my machine" failures through proactive environment validation

EnvSync is a comprehensive environment parity validator that detects and fixes drift between local development, staging, and production environments before deployment.

## 🎯 Problem

Environment drift causes silent failures - dependencies, Node.js versions, environment variables, and Docker configurations diverge between environments, leading to production incidents and wasted debugging time.

## ✨ Features

- **📸 Environment Snapshots**: Capture complete environment state (dependencies, Node versions, env vars, Docker config)
- **🔍 Drift Detection**: Compare local vs staging vs production environments with severity assessment
- **⚙️ Binary Compatibility**: Check native Node.js modules across platforms
- **🔄 One-Click Sync**: Automatically fix detected drift
- **🐳 Docker Integration**: Align Docker configs across environments
- **🚀 CI/CD Ready**: Validate in pipeline before deployment
- **📊 Beautiful Reports**: Export drift analysis as JSON/HTML

## 📦 Installation

```bash
npm install -g envsync
```

Or use in your project:

```bash
npm install --save-dev envsync
```

## 🚀 Quick Start

### 1. Capture Environment Snapshot

```bash
# Capture current environment
envsync snapshot --save local.snapshot.json

# On production server
envsync snapshot --save production.snapshot.json
```

### 2. Detect Drift

```bash
# Compare environments
envsync compare local.snapshot.json production.snapshot.json

# Or detect drift against production
envsync drift --environment production --detailed
```

### 3. Fix Drift

```bash
# Interactive sync
envsync doctor

# Or auto-fix all issues
envsync sync --auto-fix

# Dry run to see what would change
envsync sync --dry-run
```

## 📚 Usage

### Commands

#### `envsync snapshot`

Capture current environment snapshot.

```bash
envsync snapshot --save local.snapshot.json
```

**Options:**
- `-s, --save <file>` - Save snapshot to file
- `--no-docker` - Exclude Docker information
- `--no-native-modules` - Exclude native module information
- `--no-redact-sensitive` - Do not redact sensitive environment variables

#### `envsync compare`

Compare two environment snapshots.

```bash
envsync compare local.snapshot.json production.snapshot.json --detailed
```

**Options:**
- `-d, --detailed` - Show detailed drift analysis

#### `envsync drift`

Detect drift against remote environment.

```bash
envsync drift --environment production --fail-on high
```

**Options:**
- `-e, --environment <name>` - Environment to compare against (default: production)
- `-d, --detailed` - Show detailed drift analysis
- `--fail-on <severity>` - Exit with code 1 if drift severity meets or exceeds this level

#### `envsync sync`

Synchronize local environment to match remote.

```bash
envsync sync --auto-fix
```

**Options:**
- `-a, --auto-fix` - Automatically fix all drift without confirmation
- `-d, --dry-run` - Show what would be changed without making changes
- `-e, --environment <name>` - Environment to sync from (default: production)
- `-c, --categories <categories...>` - Only sync specific categories

#### `envsync validate`

Validate environment for CI/CD (exits with code 1 on failure).

```bash
envsync validate --fail-on high
```

**Options:**
- `--fail-on <severity>` - Exit with code 1 if drift severity meets or exceeds this level (default: high)
- `-e, --environment <name>` - Environment to validate against (default: production)

#### `envsync doctor`

Interactive environment health check and fixer.

```bash
envsync doctor
```

## 🔧 CI/CD Integration

### GitHub Actions

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

      - name: Install dependencies
        run: npm ci

      - name: Install EnvSync
        run: npm install -g envsync

      - name: Validate environment
        run: envsync validate --fail-on high
```

### GitLab CI

```yaml
environment-validation:
  stage: test
  image: node:18
  script:
    - npm install -g envsync
    - envsync validate --fail-on high
  only:
    - merge_requests
    - main
```

## 📖 Example Output

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

Detailed Drift Analysis
━━━━━━━━━━━━━━━━━━━━━━━

HIGH 📦 dependency - dependency.express
  Local:   ^4.18.0
  Remote:  ^5.0.0
  Impact:  Major version change (^4.18.0 → ^5.0.0) - breaking changes likely
  → Update express to ^5.0.0
```

## 🏗️ Architecture

EnvSync is built as a monorepo with multiple packages:

- **@envsync/core** - Core detection and comparison engine
- **@envsync/cli** - Command-line interface
- **@envsync/sync** - Environment synchronization engine
- **@envsync/ci-plugin** - CI/CD integration plugins

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT © EnvSync Team

## 🔗 Links

- [Documentation](https://github.com/yourusername/envsync)
- [Issue Tracker](https://github.com/yourusername/envsync/issues)
- [Changelog](https://github.com/yourusername/envsync/blob/main/CHANGELOG.md)
