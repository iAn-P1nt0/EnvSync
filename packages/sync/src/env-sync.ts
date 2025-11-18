/**
 * Environment synchronization engine
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  DriftReport,
  Drift,
  SyncOptions,
  SyncResult,
  SyncAction,
} from '@ian-p1nt0/envsync-core';

const execAsync = promisify(exec);

/**
 * Environment synchronization orchestrator
 */
export class EnvironmentSync {
  /**
   * Synchronize local environment to match remote
   */
  async sync(
    driftReport: DriftReport,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const {
      dryRun = false,
      categories,
      maxSeverity,
    } = options;

    // Filter drifts by options
    let drifts = driftReport.drifts;

    if (categories && categories.length > 0) {
      drifts = drifts.filter(d => categories.includes(d.category));
    }

    if (maxSeverity) {
      const severityOrder = ['low', 'medium', 'high', 'critical'];
      const maxIndex = severityOrder.indexOf(maxSeverity);
      drifts = drifts.filter(d => {
        const index = severityOrder.indexOf(d.severity);
        return index <= maxIndex;
      });
    }

    // Group drifts by category
    const grouped = this.groupDriftsByCategory(drifts);

    const actions: SyncAction[] = [];

    // Sync dependencies first (order matters)
    if (grouped.dependency) {
      const depActions = await this.syncDependencies(
        grouped.dependency,
        { dryRun }
      );
      actions.push(...depActions);
    }

    // Sync environment variables
    if (grouped.envvar) {
      const envActions = await this.syncEnvVars(
        grouped.envvar,
        { dryRun }
      );
      actions.push(...envActions);
    }

    // Sync Docker config
    if (grouped.docker) {
      const dockerActions = await this.syncDocker(
        grouped.docker,
        { dryRun }
      );
      actions.push(...dockerActions);
    }

    // Binary/native module issues require rebuild
    if (grouped.binary) {
      const binaryActions = await this.syncNativeModules(
        grouped.binary,
        { dryRun }
      );
      actions.push(...binaryActions);
    }

    // Node.js version changes (informational only)
    if (grouped.nodejs) {
      const nodeActions = this.syncNodeVersion(
        grouped.nodejs,
        { dryRun }
      );
      actions.push(...nodeActions);
    }

    const succeeded = actions.filter(a => a.success).length;
    const failed = actions.filter(a => !a.success).length;

    return {
      success: failed === 0,
      actions,
      summary: {
        total: actions.length,
        succeeded,
        failed,
      },
    };
  }

  /**
   * Group drifts by category
   */
  private groupDriftsByCategory(drifts: Drift[]): Record<string, Drift[]> {
    const grouped: Record<string, Drift[]> = {};

    for (const drift of drifts) {
      if (!grouped[drift.category]) {
        grouped[drift.category] = [];
      }
      grouped[drift.category].push(drift);
    }

    return grouped;
  }

  /**
   * Sync dependencies
   */
  private async syncDependencies(
    drifts: Drift[],
    options: { dryRun?: boolean }
  ): Promise<SyncAction[]> {
    const actions: SyncAction[] = [];

    for (const drift of drifts) {
      // Skip lockfile drift (handled separately)
      if (drift.field === 'lockfile') {
        actions.push({
          drift,
          success: true,
          action: 'Lockfile sync requires manual `npm install` or `npm ci`',
        });
        continue;
      }

      const pkg = drift.field.replace('dependency.', '');
      const targetVer = drift.remote as string | undefined;

      try {
        if (options.dryRun) {
          actions.push({
            drift,
            success: true,
            action: `[DRY RUN] Would ${targetVer ? `install ${pkg}@${targetVer}` : `remove ${pkg}`}`,
          });
          continue;
        }

        if (!targetVer) {
          // Remove package
          await execAsync(`npm uninstall ${pkg}`);
          actions.push({
            drift,
            success: true,
            action: `Removed ${pkg}`,
          });
        } else {
          // Install/update package
          await execAsync(`npm install ${pkg}@${targetVer} --save-exact`);
          actions.push({
            drift,
            success: true,
            action: `Updated ${pkg} to ${targetVer}`,
          });
        }
      } catch (error) {
        actions.push({
          drift,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return actions;
  }

  /**
   * Sync environment variables
   */
  private async syncEnvVars(
    drifts: Drift[],
    _options: { dryRun?: boolean }
  ): Promise<SyncAction[]> {
    const actions: SyncAction[] = [];

    for (const drift of drifts) {
      // Environment variables require manual intervention
      // We can't set them programmatically in a persistent way
      const varName = drift.field.replace('env.', '');

      actions.push({
        drift,
        success: true,
        action: `[MANUAL] Set environment variable: ${varName}=${drift.remote || '(unset)'}`,
      });
    }

    return actions;
  }

  /**
   * Sync Docker configuration
   */
  private async syncDocker(
    drifts: Drift[],
    options: { dryRun?: boolean }
  ): Promise<SyncAction[]> {
    const actions: SyncAction[] = [];

    for (const drift of drifts) {
      if (drift.field.startsWith('docker.image.')) {
        const image = drift.remote as string;

        try {
          if (options.dryRun) {
            actions.push({
              drift,
              success: true,
              action: `[DRY RUN] Would pull Docker image: ${image}`,
            });
            continue;
          }

          if (image) {
            await execAsync(`docker pull ${image}`);
            actions.push({
              drift,
              success: true,
              action: `Pulled Docker image: ${image}`,
            });
          }
        } catch (error) {
          actions.push({
            drift,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } else {
        // Version or config differences
        actions.push({
          drift,
          success: true,
          action: `[MANUAL] Docker ${drift.field} requires manual update`,
        });
      }
    }

    return actions;
  }

  /**
   * Sync native modules (rebuild)
   */
  private async syncNativeModules(
    drifts: Drift[],
    options: { dryRun?: boolean }
  ): Promise<SyncAction[]> {
    const actions: SyncAction[] = [];

    for (const drift of drifts) {
      const moduleName = drift.field.split('.')[1];

      try {
        if (options.dryRun) {
          actions.push({
            drift,
            success: true,
            action: `[DRY RUN] Would rebuild ${moduleName}`,
          });
          continue;
        }

        // Rebuild native module
        await execAsync(`npm rebuild ${moduleName}`);
        actions.push({
          drift,
          success: true,
          action: `Rebuilt native module: ${moduleName}`,
        });
      } catch (error) {
        actions.push({
          drift,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return actions;
  }

  /**
   * Node.js version sync (informational)
   */
  private syncNodeVersion(
    drifts: Drift[],
    _options: { dryRun?: boolean }
  ): SyncAction[] {
    const actions: SyncAction[] = [];

    for (const drift of drifts) {
      actions.push({
        drift,
        success: true,
        action: `[MANUAL] Update Node.js to ${drift.remote} (use nvm, volta, or system package manager)`,
      });
    }

    return actions;
  }
}
