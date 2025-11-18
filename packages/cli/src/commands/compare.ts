/**
 * Compare command - Compare two environment snapshots
 */

import { readFileSync } from 'fs';
import { deserializeSnapshot, compareSnapshots } from '@ian-p1nt0/envsync-core';
import { displayDriftSummary, displayDriftDetails, displaySuccess, displayError } from '../ui.js';

export interface CompareCommandOptions {
  detailed?: boolean;
}

/**
 * Execute compare command
 */
export async function compareCommand(
  localPath: string,
  remotePath: string,
  options: CompareCommandOptions = {}
): Promise<void> {
  try {
    // Load snapshots
    const localData = readFileSync(localPath, 'utf-8');
    const remoteData = readFileSync(remotePath, 'utf-8');

    const localSnapshot = deserializeSnapshot(localData);
    const remoteSnapshot = deserializeSnapshot(remoteData);

    // Compare
    const report = compareSnapshots(localSnapshot, remoteSnapshot);

    // Display results
    displayDriftSummary(report);

    if (options.detailed && report.hasDrift) {
      displayDriftDetails(report.drifts);
    }

    if (!report.hasDrift) {
      displaySuccess('Environments are in perfect sync!');
    }

    // Exit with appropriate code
    if (report.severity === 'critical' || report.severity === 'high') {
      process.exit(1);
    }
  } catch (error) {
    displayError(
      'Failed to compare snapshots',
      error instanceof Error ? error : undefined
    );
    process.exit(1);
  }
}
