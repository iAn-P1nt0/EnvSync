/**
 * Terminal UI utilities
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import ora, { type Ora } from 'ora';
import type { Drift, DriftReport, DriftSeverity, SyncAction } from '@ian-p1nt0/envsync-core';

/**
 * Format severity with color
 */
export function formatSeverity(severity: DriftSeverity): string {
  switch (severity) {
    case 'critical':
      return chalk.red.bold('CRITICAL');
    case 'high':
      return chalk.red('HIGH');
    case 'medium':
      return chalk.yellow('MEDIUM');
    case 'low':
      return chalk.blue('LOW');
    case 'none':
      return chalk.green('NONE');
  }
}

/**
 * Format category with icon
 */
export function formatCategory(category: string): string {
  const icons: Record<string, string> = {
    nodejs: '⬢',
    dependency: '📦',
    envvar: '🔧',
    docker: '🐳',
    binary: '⚙️',
  };

  return `${icons[category] || '•'} ${category}`;
}

/**
 * Display drift report summary
 */
export function displayDriftSummary(report: DriftReport): void {
  console.log('\n' + chalk.bold.underline('Drift Detection Summary'));
  console.log();

  if (!report.hasDrift) {
    console.log(chalk.green('✓ No drift detected - environments are in sync!'));
    return;
  }

  // Overall severity
  console.log(`Overall Severity: ${formatSeverity(report.severity)}`);
  console.log();

  // Summary table
  const summaryTable = new Table({
    head: [
      chalk.bold('Severity'),
      chalk.bold('Count'),
    ],
  });

  summaryTable.push(
    [formatSeverity('critical'), report.summary.critical],
    [formatSeverity('high'), report.summary.high],
    [formatSeverity('medium'), report.summary.medium],
    [formatSeverity('low'), report.summary.low]
  );

  console.log(summaryTable.toString());
  console.log();

  // Category breakdown
  const categoryTable = new Table({
    head: [
      chalk.bold('Category'),
      chalk.bold('Issues'),
    ],
  });

  for (const [category, count] of Object.entries(report.summary.byCategory)) {
    if (count > 0) {
      categoryTable.push([formatCategory(category), count]);
    }
  }

  console.log(categoryTable.toString());
  console.log();
}

/**
 * Display detailed drift list
 */
export function displayDriftDetails(drifts: Drift[]): void {
  console.log(chalk.bold.underline('Detailed Drift Analysis'));
  console.log();

  for (const drift of drifts) {
    const severity = formatSeverity(drift.severity);
    const category = formatCategory(drift.category);

    console.log(`${severity} ${category} - ${chalk.bold(drift.field)}`);
    console.log(`  ${chalk.dim('Local:')}   ${formatValue(drift.local)}`);
    console.log(`  ${chalk.dim('Remote:')}  ${formatValue(drift.remote)}`);
    console.log(`  ${chalk.dim('Impact:')}  ${drift.impact}`);
    console.log(`  ${chalk.cyan('→')} ${drift.recommendation}`);
    console.log();
  }
}

/**
 * Display sync plan
 */
export function displaySyncPlan(drifts: Drift[]): void {
  console.log('\n' + chalk.bold.underline('Sync Plan'));
  console.log();
  console.log('The following changes will be applied:\n');

  const table = new Table({
    head: [
      chalk.bold('Action'),
      chalk.bold('Field'),
      chalk.bold('Change'),
    ],
    colWidths: [15, 30, 50],
    wordWrap: true,
  });

  for (const drift of drifts) {
    let action = 'Update';
    if (drift.local === undefined) action = 'Add';
    if (drift.remote === undefined) action = 'Remove';

    const change = `${formatValue(drift.local)} → ${formatValue(drift.remote)}`;

    table.push([
      action,
      drift.field,
      change,
    ]);
  }

  console.log(table.toString());
  console.log();
}

/**
 * Display sync results
 */
export function displaySyncResults(actions: SyncAction[]): void {
  console.log('\n' + chalk.bold.underline('Sync Results'));
  console.log();

  const succeeded = actions.filter(a => a.success);
  const failed = actions.filter(a => !a.success);

  console.log(`${chalk.green('✓')} Succeeded: ${succeeded.length}`);
  console.log(`${chalk.red('✗')} Failed: ${failed.length}`);
  console.log();

  if (succeeded.length > 0) {
    console.log(chalk.green.bold('Successful Actions:'));
    for (const action of succeeded) {
      console.log(`  ${chalk.green('✓')} ${action.action}`);
    }
    console.log();
  }

  if (failed.length > 0) {
    console.log(chalk.red.bold('Failed Actions:'));
    for (const action of failed) {
      console.log(`  ${chalk.red('✗')} ${action.drift.field}`);
      console.log(`     ${chalk.dim(action.error)}`);
    }
    console.log();
  }
}

/**
 * Create spinner for long operations
 */
export function createSpinner(text: string): Ora {
  return ora({
    text,
    color: 'cyan',
  });
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === undefined) {
    return chalk.dim('(not set)');
  }

  if (value === null) {
    return chalk.dim('(null)');
  }

  if (typeof value === 'string') {
    if (value === '[REDACTED]') {
      return chalk.dim.italic('[REDACTED]');
    }
    return chalk.cyan(value);
  }

  return chalk.cyan(String(value));
}

/**
 * Display error message
 */
export function displayError(message: string, error?: Error): void {
  console.error('\n' + chalk.red.bold('✗ Error:'), message);
  if (error) {
    console.error(chalk.dim(error.message));
  }
  console.error();
}

/**
 * Display success message
 */
export function displaySuccess(message: string): void {
  console.log('\n' + chalk.green.bold('✓'), message);
  console.log();
}

/**
 * Display warning message
 */
export function displayWarning(message: string): void {
  console.warn('\n' + chalk.yellow.bold('⚠'), message);
  console.warn();
}

/**
 * Display info message
 */
export function displayInfo(message: string): void {
  console.log('\n' + chalk.blue.bold('ℹ'), message);
  console.log();
}
