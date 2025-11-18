# EnvSync Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
# Navigate to project directory
cd EnvSync

# Install dependencies
npm install

# Build all packages
npm run build

# Link CLI globally for local testing
cd packages/cli
npm link
cd ../..
```

### Verify Installation

```bash
envsync --version
envsync --help
```

## 📋 Basic Workflow

### 1. Capture Your First Snapshot

```bash
# Capture local environment
envsync snapshot --save local.snapshot.json
```

**Expected Output:**
```
✔ Environment snapshot captured

Environment: local
Node.js: v20.10.0
Platform: darwin (arm64)
Dependencies: 15 production, 8 dev
Environment Variables: 42 (6 redacted)
Docker: 24.0.6
Snapshot Hash: f3a9d8e2c1b4

✓ Snapshot saved to: local.snapshot.json
```

### 2. Compare Environments

```bash
# Compare two snapshots
envsync compare local.snapshot.json production.snapshot.json --detailed
```

### 3. Detect Drift

```bash
# Quick drift check
envsync drift --environment production

# Detailed analysis
envsync drift --detailed

# Fail on high severity (for CI)
envsync drift --fail-on high
```

### 4. Fix Issues Interactively

```bash
# Launch interactive doctor mode
envsync doctor
```

**What doctor does:**
1. Diagnoses your environment
2. Shows all detected issues
3. Lets you choose which to fix
4. Applies fixes automatically

### 5. Sync Environments

```bash
# Preview changes (dry run)
envsync sync --dry-run

# Interactive sync with confirmation
envsync sync

# Auto-fix everything
envsync sync --auto-fix

# Sync only specific categories
envsync sync --categories dependency envvar
```

## 🔧 Development Workflow

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:int
```

### Development Mode

```bash
# Watch and rebuild on changes
npm run dev
```

### Build

```bash
# Build all packages
npm run build

# Clean build artifacts
npm run clean
```

## 🎯 Common Use Cases

### Use Case 1: Pre-Deployment Check

```bash
# Before deploying, verify environment parity
envsync drift --environment production --fail-on high

# If drift detected, fix it
envsync sync --auto-fix
```

### Use Case 2: CI/CD Integration

Add to `.github/workflows/validate.yml`:

```yaml
- name: Validate Environment
  run: |
    npm install -g envsync
    envsync validate --fail-on high
```

### Use Case 3: Team Onboarding

```bash
# New team member joins
# 1. Clone repo
# 2. Get team's baseline snapshot
# 3. Sync local environment
envsync sync --from team-baseline.snapshot.json --auto-fix
```

### Use Case 4: Multi-Environment Management

```bash
# Capture snapshots for each environment
envsync snapshot --save local.snapshot.json
envsync snapshot --save staging.snapshot.json  # Run on staging
envsync snapshot --save prod.snapshot.json     # Run on production

# Compare any two
envsync compare local.snapshot.json staging.snapshot.json
envsync compare staging.snapshot.json prod.snapshot.json
```

## 📊 Understanding Output

### Severity Levels

- **🔴 CRITICAL**: Platform/architecture mismatches, broken binaries - **immediate action required**
- **🟠 HIGH**: Missing dependencies, major version changes - **high priority**
- **🟡 MEDIUM**: Minor version differences, extra dependencies - **should fix**
- **🔵 LOW**: Patch versions, non-critical differences - **nice to fix**

### Categories

- **⬢ nodejs**: Node.js version, npm version, platform, architecture
- **📦 dependency**: Package versions, lockfile consistency
- **🔧 envvar**: Environment variables
- **🐳 docker**: Docker version, images, containers, compose configs
- **⚙️ binary**: Native modules, binary compatibility

## 🐛 Troubleshooting

### Issue: "Cannot find production.snapshot.json"

**Solution**: Create a production snapshot first:
```bash
# On production server:
envsync snapshot --save production.snapshot.json

# Copy to local:
scp user@prod:/path/production.snapshot.json .
```

### Issue: Docker commands fail

**Solution**: EnvSync handles Docker unavailability gracefully. If Docker isn't running, it will skip Docker checks.

### Issue: Permission errors during sync

**Solution**: Run with appropriate permissions or use `--dry-run` to preview:
```bash
envsync sync --dry-run
```

## 📚 Next Steps

- Read the [full documentation](./README.md)
- Check out [usage examples](./examples/basic-usage.md)
- Review [CLAUDE.md](./CLAUDE.md) for development guidelines
- Explore the [CI/CD integration guide](./docs/ci-cd.md)

## 💡 Pro Tips

1. **Commit snapshots**: Add baseline snapshots to version control
2. **CI validation**: Always validate in CI before merging
3. **Regular checks**: Run `envsync doctor` weekly
4. **Team alignment**: Share snapshots across team
5. **Automate**: Use pre-commit hooks for drift detection

---

**Ready to eliminate "works on my machine" failures?** 🚀

Run `envsync doctor` now!
