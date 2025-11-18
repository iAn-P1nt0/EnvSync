#!/usr/bin/env node

/**
 * EnvSync CLI - Environment Parity Validator
 */

import { Command } from 'commander';
import { snapshotCommand } from './commands/snapshot.js';
import { compareCommand } from './commands/compare.js';
import { driftCommand } from './commands/drift.js';
import { syncCommand } from './commands/sync.js';
import { validateCommand } from './commands/validate.js';
import { doctorCommand } from './commands/doctor.js';

const program = new Command();

program
  .name('envsync')
  .description('Environment Parity Validator - Eliminate "works on my machine" failures')
  .version('0.1.0');

// Snapshot command
program
  .command('snapshot')
  .description('Capture current environment snapshot')
  .option('-s, --save <file>', 'Save snapshot to file')
  .option('--no-docker', 'Exclude Docker information')
  .option('--no-native-modules', 'Exclude native module information')
  .option('--no-redact-sensitive', 'Do not redact sensitive environment variables')
  .action(async (options) => {
    await snapshotCommand({
      save: options.save,
      includeDocker: options.docker,
      includeNativeModules: options.nativeModules,
      redactSensitive: options.redactSensitive,
    });
  });

// Compare command
program
  .command('compare')
  .description('Compare two environment snapshots')
  .argument('<local>', 'Path to local snapshot file')
  .argument('<remote>', 'Path to remote snapshot file')
  .option('-d, --detailed', 'Show detailed drift analysis')
  .action(async (local, remote, options) => {
    await compareCommand(local, remote, {
      detailed: options.detailed,
    });
  });

// Drift command
program
  .command('drift')
  .description('Detect drift against remote environment')
  .option('-e, --environment <name>', 'Environment to compare against (default: production)')
  .option('-d, --detailed', 'Show detailed drift analysis')
  .option('--fail-on <severity>', 'Exit with code 1 if drift severity meets or exceeds this level (critical, high, medium, low)')
  .action(async (options) => {
    await driftCommand({
      environment: options.environment,
      detailed: options.detailed,
      failOn: options.failOn,
    });
  });

// Sync command
program
  .command('sync')
  .description('Synchronize local environment to match remote')
  .option('-a, --auto-fix', 'Automatically fix all drift without confirmation')
  .option('-d, --dry-run', 'Show what would be changed without making changes')
  .option('-e, --environment <name>', 'Environment to sync from (default: production)')
  .option('-c, --categories <categories...>', 'Only sync specific categories (nodejs, dependency, envvar, docker, binary)')
  .action(async (options) => {
    await syncCommand({
      autoFix: options.autoFix,
      dryRun: options.dryRun,
      environment: options.environment,
      categories: options.categories,
    });
  });

// Validate command
program
  .command('validate')
  .description('Validate environment for CI/CD (exits with code 1 on failure)')
  .option('--fail-on <severity>', 'Exit with code 1 if drift severity meets or exceeds this level (default: high)')
  .option('-e, --environment <name>', 'Environment to validate against (default: production)')
  .action(async (options) => {
    await validateCommand({
      failOn: options.failOn || 'high',
      environment: options.environment,
    });
  });

// Doctor command
program
  .command('doctor')
  .description('Interactive environment health check and fixer')
  .action(async () => {
    await doctorCommand();
  });

// Parse arguments
program.parse();
