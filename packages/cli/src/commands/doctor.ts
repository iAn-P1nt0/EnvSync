/**
 * Doctor command - Interactive environment health check and fixer
 */

import { readFileSync } from 'fs';
import prompts from 'prompts';
import { captureSnapshot, deserializeSnapshot, compareSnapshots } from '@ian-p1nt0/envsync-core';
import { EnvironmentSync } from '@ian-p1nt0/envsync-sync';
import {
  createSpinner,
  displayDriftSummary,
  displayDriftDetails,
  displaySyncResults,
  displaySuccess,
  displayError,
} from '../ui.js';

/**
 * Execute doctor command
 */
export async function doctorCommand(): Promise<void> {
  console.log('🩺 EnvSync Doctor - Interactive Environment Health Check\n');

  const spinner = createSpinner('Diagnosing environment...');
  spinner.start();

  try {
    // Capture local snapshot
    const localSnapshot = await captureSnapshot();

    // Check if remote snapshot exists
    let remoteSnapshot;
    try {
      const remoteData = readFileSync('production.snapshot.json', 'utf-8');
      remoteSnapshot = deserializeSnapshot(remoteData);
    } catch {
      spinner.warn('No production snapshot found');
      console.log('\nTo use doctor mode, create a production snapshot first:');
      console.log('  envsync snapshot --save production.snapshot.json\n');
      return;
    }

    // Compare
    const report = compareSnapshots(localSnapshot, remoteSnapshot);

    spinner.succeed('Diagnosis complete');

    if (!report.hasDrift) {
      displaySuccess('Your environment is healthy - no issues detected!');
      return;
    }

    // Display issues
    displayDriftSummary(report);
    console.log();

    // Ask what to do
    const response = await prompts([
      {
        type: 'select',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { title: 'View detailed drift analysis', value: 'details' },
          { title: 'Automatically fix all issues', value: 'fix-all' },
          { title: 'Select issues to fix', value: 'fix-selective' },
          { title: 'Exit', value: 'exit' },
        ],
      },
    ]);

    if (response.action === 'exit') {
      return;
    }

    if (response.action === 'details') {
      displayDriftDetails(report.drifts);
      return;
    }

    if (response.action === 'fix-all') {
      const confirmResponse = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: `Fix all ${report.drifts.length} issues?`,
        initial: false,
      });

      if (!confirmResponse.proceed) {
        console.log('Cancelled.');
        return;
      }

      const syncSpinner = createSpinner('Fixing issues...');
      syncSpinner.start();

      const sync = new EnvironmentSync();
      const result = await sync.sync(report, { autoFix: true });

      syncSpinner.succeed('Fix complete');
      displaySyncResults(result.actions);

      if (result.success) {
        displaySuccess('All issues resolved!');
      }
    }

    if (response.action === 'fix-selective') {
      // Group by category for selection
      const choices = report.drifts.map((drift, index) => ({
        title: `[${drift.severity.toUpperCase()}] ${drift.field}: ${drift.recommendation}`,
        value: index,
        selected: drift.severity === 'critical' || drift.severity === 'high',
      }));

      const selectResponse = await prompts({
        type: 'multiselect',
        name: 'selected',
        message: 'Select issues to fix:',
        choices,
      });

      if (!selectResponse.selected || selectResponse.selected.length === 0) {
        console.log('No issues selected.');
        return;
      }

      const selectedDrifts = selectResponse.selected.map((i: number) => report.drifts[i]);

      const syncSpinner = createSpinner(`Fixing ${selectedDrifts.length} issues...`);
      syncSpinner.start();

      const sync = new EnvironmentSync();
      const result = await sync.sync(
        { ...report, drifts: selectedDrifts },
        { autoFix: true }
      );

      syncSpinner.succeed('Fix complete');
      displaySyncResults(result.actions);

      if (result.success) {
        displaySuccess('Selected issues resolved!');
      }
    }
  } catch (error) {
    spinner.fail('Doctor failed');
    displayError(
      'Could not complete health check',
      error instanceof Error ? error : undefined
    );
    process.exit(1);
  }
}
