/**
 * GitHub Actions integration
 */

import { captureSnapshot, compareSnapshots, deserializeSnapshot } from '@ian-p1nt0/envsync-core';
import { readFileSync } from 'fs';

export interface GitHubActionOptions {
  baselineSnapshot: string;
  failOn?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Run EnvSync validation in GitHub Actions
 */
export async function runGitHubAction(
  options: GitHubActionOptions
): Promise<void> {
  console.log('::group::EnvSync Environment Validation');

  try {
    // Capture current environment
    console.log('Capturing environment snapshot...');
    const localSnapshot = await captureSnapshot();

    // Load baseline snapshot
    console.log(`Loading baseline snapshot: ${options.baselineSnapshot}`);
    const baselineData = readFileSync(options.baselineSnapshot, 'utf-8');
    const baselineSnapshot = deserializeSnapshot(baselineData);

    // Compare
    console.log('Comparing environments...');
    const report = compareSnapshots(localSnapshot, baselineSnapshot);

    // Output results
    console.log('::endgroup::');

    if (!report.hasDrift) {
      console.log('✓ No drift detected - environments are in sync!');
      return;
    }

    // Display drift summary
    console.log(`::warning::Environment drift detected (severity: ${report.severity})`);
    console.log(`Total issues: ${report.summary.total}`);
    console.log(`  Critical: ${report.summary.critical}`);
    console.log(`  High: ${report.summary.high}`);
    console.log(`  Medium: ${report.summary.medium}`);
    console.log(`  Low: ${report.summary.low}`);

    // Set outputs
    console.log(`::set-output name=has_drift::${report.hasDrift}`);
    console.log(`::set-output name=severity::${report.severity}`);
    console.log(`::set-output name=total_issues::${report.summary.total}`);

    // Detailed drift annotations
    for (const drift of report.drifts) {
      const level = drift.severity === 'critical' || drift.severity === 'high'
        ? 'error'
        : 'warning';

      console.log(
        `::${level}::${drift.category} - ${drift.field}: ${drift.recommendation}`
      );
    }

    // Check if we should fail
    const failOn = options.failOn || 'high';
    const severityOrder = ['none', 'low', 'medium', 'high', 'critical'];
    const failOnIndex = severityOrder.indexOf(failOn);
    const reportIndex = severityOrder.indexOf(report.severity);

    if (reportIndex >= failOnIndex) {
      console.log(`::error::Environment validation failed (severity: ${report.severity} >= ${failOn})`);
      process.exit(1);
    }
  } catch (error) {
    console.log('::endgroup::');
    console.log(`::error::EnvSync validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
