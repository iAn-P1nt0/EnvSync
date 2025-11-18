/**
 * Snapshot command - Capture environment snapshot
 */

import { writeFileSync } from 'fs';
import { captureSnapshot, serializeSnapshot } from '@envsync/core';
import { createSpinner, displaySuccess, displayError } from '../ui.js';

export interface SnapshotCommandOptions {
  save?: string;
  includeDocker?: boolean;
  includeNativeModules?: boolean;
  redactSensitive?: boolean;
}

/**
 * Execute snapshot command
 */
export async function snapshotCommand(
  options: SnapshotCommandOptions = {}
): Promise<void> {
  const spinner = createSpinner('Capturing environment snapshot...');
  spinner.start();

  try {
    const snapshot = await captureSnapshot({
      includeDocker: options.includeDocker ?? true,
      includeNativeModules: options.includeNativeModules ?? true,
      redactSensitive: options.redactSensitive ?? true,
    });

    spinner.succeed('Environment snapshot captured');

    // Display summary
    console.log();
    console.log(`Environment: ${snapshot.environment}`);
    console.log(`Node.js: ${snapshot.nodeVersion.version}`);
    console.log(`Platform: ${snapshot.nodeVersion.platform} (${snapshot.nodeVersion.arch})`);
    console.log(`Dependencies: ${Object.keys(snapshot.dependencies.production).length} production, ${Object.keys(snapshot.dependencies.development).length} dev`);
    console.log(`Environment Variables: ${Object.keys(snapshot.envVars.variables).length} (${snapshot.envVars.redacted.length} redacted)`);
    console.log(`Docker: ${snapshot.docker.version || 'Not available'}`);
    console.log(`Snapshot Hash: ${snapshot.hash}`);

    // Save to file if requested
    if (options.save) {
      const serialized = serializeSnapshot(snapshot);
      writeFileSync(options.save, serialized, 'utf-8');
      displaySuccess(`Snapshot saved to: ${options.save}`);
    } else {
      console.log('\n' + serializeSnapshot(snapshot));
    }
  } catch (error) {
    spinner.fail('Failed to capture snapshot');
    displayError(
      'Could not capture environment snapshot',
      error instanceof Error ? error : undefined
    );
    process.exit(1);
  }
}
