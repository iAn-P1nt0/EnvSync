/**
 * Drift command - Detect drift against remote environment
 */

import { readFileSync } from 'fs';
import { captureSnapshot, deserializeSnapshot, compareSnapshots } from '@ian-p1nt0/envsync-core';
import { createSpinner, displayDriftSummary, displayDriftDetails, displaySuccess, displayError } from '../ui.js';

export interface DriftCommandOptions {
  environment?: string;
  detailed?: boolean;
  failOn?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Execute drift command
 */
export async function driftCommand(
  options: DriftCommandOptions = {}
): Promise<void> {
  const spinner = createSpinner('Detecting environment drift...');
  spinner.start();

  try {
    // Capture local snapshot
    const localSnapshot = await captureSnapshot();

    // Load remote snapshot (from file or environment)
    let remoteSnapshot;

    if (options.environment) {
      const remotePath = `${options.environment}.snapshot.json`;
      const remoteData = readFileSync(remotePath, 'utf-8');
      remoteSnapshot = deserializeSnapshot(remoteData);
    } else {
      // Default to production snapshot
      const remoteData = readFileSync('production.snapshot.json', 'utf-8');
      remoteSnapshot = deserializeSnapshot(remoteData);
    }

    spinner.succeed('Drift detection complete');

    // Compare
    const report = compareSnapshots(localSnapshot, remoteSnapshot);

    // Display results
    displayDriftSummary(report);

    if (options.detailed && report.hasDrift) {
      displayDriftDetails(report.drifts);
    }

    if (!report.hasDrift) {
      displaySuccess('No drift detected!');
      return;
    }

    // Check if we should fail based on severity
    if (options.failOn) {
      const severityOrder = ['low', 'medium', 'high', 'critical'];
      const failOnIndex = severityOrder.indexOf(options.failOn);
      const reportIndex = severityOrder.indexOf(report.severity);

      if (reportIndex >= failOnIndex) {
        process.exit(1);
      }
    }
  } catch (error) {
    spinner.fail('Drift detection failed');
    displayError(
      'Could not detect drift',
      error instanceof Error ? error : undefined
    );
    process.exit(1);
  }
}
