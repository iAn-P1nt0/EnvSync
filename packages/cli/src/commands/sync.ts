/**
 * Sync command - Synchronize environments
 */

import { readFileSync } from 'fs';
import prompts from 'prompts';
import { captureSnapshot, deserializeSnapshot, compareSnapshots } from '@envsync/core';
import { EnvironmentSync } from '@envsync/sync';
import {
  createSpinner,
  displaySyncPlan,
  displaySyncResults,
  displaySuccess,
  displayError,
  displayWarning,
} from '../ui.js';

export interface SyncCommandOptions {
  autoFix?: boolean;
  dryRun?: boolean;
  environment?: string;
  categories?: string[];
}

/**
 * Execute sync command
 */
export async function syncCommand(
  options: SyncCommandOptions = {}
): Promise<void> {
  const spinner = createSpinner('Analyzing environment drift...');
  spinner.start();

  try {
    // Capture local snapshot
    const localSnapshot = await captureSnapshot();

    // Load remote snapshot
    let remoteSnapshot;

    if (options.environment) {
      const remotePath = `${options.environment}.snapshot.json`;
      const remoteData = readFileSync(remotePath, 'utf-8');
      remoteSnapshot = deserializeSnapshot(remoteData);
    } else {
      const remoteData = readFileSync('production.snapshot.json', 'utf-8');
      remoteSnapshot = deserializeSnapshot(remoteData);
    }

    // Compare
    const report = compareSnapshots(localSnapshot, remoteSnapshot);

    spinner.succeed('Environment analysis complete');

    if (!report.hasDrift) {
      displaySuccess('No drift detected - environments are in sync!');
      return;
    }

    // Display sync plan
    displaySyncPlan(report.drifts);

    if (options.dryRun) {
      displayWarning('Dry run mode - no changes will be made');
    }

    // Confirm sync (unless auto-fix is enabled)
    if (!options.autoFix && !options.dryRun) {
      const response = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: 'Apply these changes?',
        initial: false,
      });

      if (!response.proceed) {
        console.log('Sync cancelled.');
        return;
      }
    }

    // Execute sync
    const syncSpinner = createSpinner('Synchronizing environments...');
    syncSpinner.start();

    const sync = new EnvironmentSync();
    const result = await sync.sync(report, {
      autoFix: options.autoFix,
      dryRun: options.dryRun,
      categories: options.categories as any,
    });

    syncSpinner.succeed('Sync complete');

    // Display results
    displaySyncResults(result.actions);

    if (result.success) {
      displaySuccess('All changes applied successfully!');
    } else {
      displayWarning(`Some changes failed (${result.summary.failed} of ${result.summary.total})`);
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Sync failed');
    displayError(
      'Could not synchronize environments',
      error instanceof Error ? error : undefined
    );
    process.exit(1);
  }
}
