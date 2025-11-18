/**
 * Report generator (JSON and HTML exports)
 */

import { writeFileSync } from 'fs';
import type { DriftReport, Drift } from '@envsync/core';

/**
 * Generate JSON report
 */
export function generateJSONReport(report: DriftReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Save JSON report to file
 */
export function saveJSONReport(report: DriftReport, path: string): void {
  const json = generateJSONReport(report);
  writeFileSync(path, json, 'utf-8');
}

/**
 * Generate HTML report
 */
export function generateHTMLReport(report: DriftReport): string {
  const severityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#10b981';
    }
  };

  const categoryIcon = (category: string): string => {
    switch (category) {
      case 'nodejs': return '⬢';
      case 'dependency': return '📦';
      case 'envvar': return '🔧';
      case 'docker': return '🐳';
      case 'binary': return '⚙️';
      default: return '•';
    }
  };

  const driftRows = report.drifts.map((drift: Drift) => `
    <tr>
      <td style="color: ${severityColor(drift.severity)}; font-weight: bold;">
        ${drift.severity.toUpperCase()}
      </td>
      <td>
        ${categoryIcon(drift.category)} ${drift.category}
      </td>
      <td><code>${drift.field}</code></td>
      <td><code>${formatValue(drift.local)}</code></td>
      <td><code>${formatValue(drift.remote)}</code></td>
      <td>${drift.impact}</td>
      <td style="color: #3b82f6;">${drift.recommendation}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EnvSync Drift Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f9fafb;
      padding: 2rem;
      color: #111827;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: #111827;
    }

    .subtitle {
      color: #6b7280;
      margin-bottom: 2rem;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 0.5rem;
      border-left: 4px solid #3b82f6;
    }

    .summary-card h3 {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .summary-card p {
      font-size: 1.5rem;
      font-weight: bold;
      color: #111827;
    }

    .severity-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      background: ${severityColor(report.severity)};
      margin-bottom: 2rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
    }

    th {
      background: #f9fafb;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    td {
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    tr:hover {
      background: #f9fafb;
    }

    code {
      background: #f3f4f6;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
    }

    .success {
      color: #10b981;
      font-weight: 600;
      text-align: center;
      padding: 2rem;
    }

    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>EnvSync Drift Report</h1>
    <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>

    ${!report.hasDrift ? `
      <div class="success">
        ✓ No drift detected - environments are in perfect sync!
      </div>
    ` : `
      <div class="severity-badge">Overall Severity: ${report.severity.toUpperCase()}</div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total Issues</h3>
          <p>${report.summary.total}</p>
        </div>
        <div class="summary-card" style="border-color: #dc2626;">
          <h3>Critical</h3>
          <p>${report.summary.critical}</p>
        </div>
        <div class="summary-card" style="border-color: #ef4444;">
          <h3>High</h3>
          <p>${report.summary.high}</p>
        </div>
        <div class="summary-card" style="border-color: #f59e0b;">
          <h3>Medium</h3>
          <p>${report.summary.medium}</p>
        </div>
        <div class="summary-card" style="border-color: #3b82f6;">
          <h3>Low</h3>
          <p>${report.summary.low}</p>
        </div>
      </div>

      <h2 style="margin-bottom: 1rem;">Detailed Analysis</h2>

      <table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Category</th>
            <th>Field</th>
            <th>Local</th>
            <th>Remote</th>
            <th>Impact</th>
            <th>Recommendation</th>
          </tr>
        </thead>
        <tbody>
          ${driftRows}
        </tbody>
      </table>
    `}

    <div class="footer">
      <p>Generated by EnvSync - Environment Parity Validator</p>
      <p>Local: ${report.localSnapshot.environment} | Remote: ${report.remoteSnapshot.environment}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Save HTML report to file
 */
export function saveHTMLReport(report: DriftReport, path: string): void {
  const html = generateHTMLReport(report);
  writeFileSync(path, html, 'utf-8');
}

/**
 * Format value for display
 */
function formatValue(value: unknown): string {
  if (value === undefined) return '(not set)';
  if (value === null) return '(null)';
  if (typeof value === 'string') return value;
  return String(value);
}
