/**
 * GitLab CI integration
 */

import { captureSnapshot, compareSnapshots, deserializeSnapshot } from '@envsync/core';
import { readFileSync } from 'fs';

export interface GitLabCIOptions {
  baselineSnapshot: string;
  failOn?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Run EnvSync validation in GitLab CI
 */
export async function runGitLabCI(
  options: GitLabCIOptions
): Promise<void> {
  console.log('EnvSync Environment Validation');
  console.log('================================\n');

  try {
    // Capture current environment
    console.log('Capturing environment snapshot...');
    const localSnapshot = await captureSnapshot();

    // Load baseline snapshot
    console.log(`Loading baseline snapshot: ${options.baselineSnapshot}`);
    const baselineData = readFileSync(options.baselineSnapshot, 'utf-8');
    const baselineSnapshot = deserializeSnapshot(baselineData);

    // Compare
    console.log('Comparing environments...\n');
    const report = compareSnapshots(localSnapshot, baselineSnapshot);

    if (!report.hasDrift) {
      console.log('✓ No drift detected - environments are in sync!');
      return;
    }

    // Display drift summary
    console.log(`⚠ Environment drift detected (severity: ${report.severity})`);
    console.log(`Total issues: ${report.summary.total}`);
    console.log(`  Critical: ${report.summary.critical}`);
    console.log(`  High: ${report.summary.high}`);
    console.log(`  Medium: ${report.summary.medium}`);
    console.log(`  Low: ${report.summary.low}\n`);

    // Detailed drift list
    for (const drift of report.drifts) {
      console.log(`[${drift.severity.toUpperCase()}] ${drift.category} - ${drift.field}`);
      console.log(`  Recommendation: ${drift.recommendation}`);
    }

    // Check if we should fail
    const failOn = options.failOn || 'high';
    const severityOrder = ['none', 'low', 'medium', 'high', 'critical'];
    const failOnIndex = severityOrder.indexOf(failOn);
    const reportIndex = severityOrder.indexOf(report.severity);

    if (reportIndex >= failOnIndex) {
      console.error(`\n✗ Environment validation failed (severity: ${report.severity} >= ${failOn})`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n✗ EnvSync validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
