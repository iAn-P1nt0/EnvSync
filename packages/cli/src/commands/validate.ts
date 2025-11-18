/**
 * Validate command - Validate environment for CI/CD
 */

import { readFileSync } from 'fs';
import { captureSnapshot, deserializeSnapshot, compareSnapshots } from '@envsync/core';
import { createSpinner, displayDriftSummary, displayError } from '../ui.js';

export interface ValidateCommandOptions {
  failOn?: 'critical' | 'high' | 'medium' | 'low';
  environment?: string;
}

/**
 * Execute validate command
 */
export async function validateCommand(
  options: ValidateCommandOptions = {}
): Promise<void> {
  const spinner = createSpinner('Validating environment...');
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

    spinner.succeed('Validation complete');

    // Display results
    displayDriftSummary(report);

    if (!report.hasDrift) {
      console.log('✓ Environment validation passed');
      process.exit(0);
    }

    // Check severity threshold
    const failOn = options.failOn || 'high';
    const severityOrder = ['none', 'low', 'medium', 'high', 'critical'];
    const failOnIndex = severityOrder.indexOf(failOn);
    const reportIndex = severityOrder.indexOf(report.severity);

    if (reportIndex >= failOnIndex) {
      console.error(`✗ Environment validation failed (severity: ${report.severity})`);
      process.exit(1);
    } else {
      console.log(`✓ Environment validation passed (severity below ${failOn} threshold)`);
      process.exit(0);
    }
  } catch (error) {
    spinner.fail('Validation failed');
    displayError(
      'Could not validate environment',
      error instanceof Error ? error : undefined
    );
    process.exit(1);
  }
}
