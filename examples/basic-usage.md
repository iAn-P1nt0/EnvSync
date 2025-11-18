# Basic Usage Examples

## Example 1: Capture and Compare Snapshots

### Step 1: Capture Local Snapshot

```bash
cd /path/to/your/project
envsync snapshot --save local.snapshot.json
```

**Output:**
```
✔ Environment snapshot captured

Environment: local
Node.js: v18.17.0
Platform: darwin (x64)
Dependencies: 45 production, 23 dev
Environment Variables: 32 (8 redacted)
Docker: 24.0.5
Snapshot Hash: a3f8d9e2c1b4a5d6

✓ Snapshot saved to: local.snapshot.json
```

### Step 2: Capture Production Snapshot

On your production server:

```bash
envsync snapshot --save production.snapshot.json
```

### Step 3: Compare Environments

```bash
envsync compare local.snapshot.json production.snapshot.json --detailed
```

## Example 2: Automated Drift Detection

```bash
# Detect drift against production
envsync drift --environment production --detailed

# Fail CI if high severity drift detected
envsync drift --fail-on high
```

## Example 3: Interactive Doctor Mode

```bash
envsync doctor
```

This will:
1. Diagnose your environment
2. Show detected issues
3. Let you select which issues to fix
4. Automatically apply fixes

## Example 4: Sync Workflow

```bash
# Preview changes (dry run)
envsync sync --dry-run

# Sync with confirmation
envsync sync

# Auto-fix everything
envsync sync --auto-fix

# Sync only dependencies
envsync sync --categories dependency
```

## Example 5: CI/CD Validation

Add to your `.github/workflows/validate.yml`:

```yaml
name: Environment Validation

on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install EnvSync
        run: npm install -g envsync

      - name: Validate environment
        run: envsync validate --fail-on high
```

## Example 6: Export Reports

```bash
# Capture drift and export as JSON
envsync drift --environment production > drift-report.json

# Or use the programmatic API
node -e "
  const { captureSnapshot, compareSnapshots } = require('@envsync/core');
  const { saveHTMLReport } = require('@envsync/cli/reporter');

  (async () => {
    const local = await captureSnapshot();
    const remote = await captureSnapshot();
    const report = compareSnapshots(local, remote);

    saveHTMLReport(report, 'drift-report.html');
    console.log('Report saved!');
  })();
"
```
