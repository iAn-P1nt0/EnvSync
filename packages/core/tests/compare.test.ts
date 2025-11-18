/**
 * Tests for drift detection
 */

import { describe, it, expect } from 'vitest';
import { compareSnapshots } from '../src/compare.js';
import type { EnvironmentSnapshot } from '../src/types.js';

describe('Drift Detection', () => {
  const createMockSnapshot = (overrides: Partial<EnvironmentSnapshot> = {}): EnvironmentSnapshot => ({
    timestamp: new Date(),
    environment: 'local',
    nodeVersion: {
      version: 'v18.0.0',
      npmVersion: '9.0.0',
      platform: 'darwin',
      arch: 'x64',
      v8Version: '10.0.0',
      modules: '108',
      openssl: '3.0.0',
    },
    dependencies: {
      production: {},
      development: {},
      lockfileHash: 'abc123',
      nativeModules: [],
    },
    envVars: {
      variables: {},
      redacted: [],
    },
    docker: {
      version: null,
      platform: null,
      arch: null,
      images: [],
      containers: [],
      composeConfigs: [],
    },
    system: {
      platform: 'darwin',
      arch: 'x64',
      cpus: 8,
      totalMemory: 16000000000,
      freeMemory: 8000000000,
      hostname: 'localhost',
    },
    hash: 'test123',
    ...overrides,
  });

  it('should detect no drift when snapshots are identical', () => {
    const local = createMockSnapshot();
    const remote = createMockSnapshot();

    const report = compareSnapshots(local, remote);

    expect(report.hasDrift).toBe(false);
    expect(report.severity).toBe('none');
    expect(report.drifts.length).toBe(0);
  });

  it('should detect Node.js version drift', () => {
    const local = createMockSnapshot({
      nodeVersion: {
        version: 'v18.0.0',
        npmVersion: '9.0.0',
        platform: 'darwin',
        arch: 'x64',
        v8Version: '10.0.0',
        modules: '108',
      },
    });

    const remote = createMockSnapshot({
      nodeVersion: {
        version: 'v20.0.0',
        npmVersion: '9.0.0',
        platform: 'darwin',
        arch: 'x64',
        v8Version: '11.0.0',
        modules: '115',
      },
    });

    const report = compareSnapshots(local, remote);

    expect(report.hasDrift).toBe(true);
    expect(report.drifts.some(d => d.category === 'nodejs')).toBe(true);
  });

  it('should detect dependency drift', () => {
    const local = createMockSnapshot({
      dependencies: {
        production: { express: '^4.0.0' },
        development: {},
        lockfileHash: 'abc123',
        nativeModules: [],
      },
    });

    const remote = createMockSnapshot({
      dependencies: {
        production: { express: '^5.0.0' },
        development: {},
        lockfileHash: 'xyz789',
        nativeModules: [],
      },
    });

    const report = compareSnapshots(local, remote);

    expect(report.hasDrift).toBe(true);
    expect(report.drifts.some(d => d.category === 'dependency')).toBe(true);
  });

  it('should assess severity correctly', () => {
    const local = createMockSnapshot({
      nodeVersion: {
        version: 'v18.0.0',
        npmVersion: '9.0.0',
        platform: 'darwin',
        arch: 'x64',
        v8Version: '10.0.0',
        modules: '108',
      },
    });

    const remote = createMockSnapshot({
      nodeVersion: {
        version: 'v20.0.0',
        npmVersion: '9.0.0',
        platform: 'darwin',
        arch: 'x64',
        v8Version: '11.0.0',
        modules: '115',
      },
    });

    const report = compareSnapshots(local, remote);

    expect(['low', 'medium', 'high', 'critical']).toContain(report.severity);
  });

  it('should generate summary statistics', () => {
    const local = createMockSnapshot({
      dependencies: {
        production: { express: '^4.0.0', lodash: '^4.0.0' },
        development: {},
        lockfileHash: 'abc123',
        nativeModules: [],
      },
    });

    const remote = createMockSnapshot({
      dependencies: {
        production: { express: '^5.0.0', react: '^18.0.0' },
        development: {},
        lockfileHash: 'xyz789',
        nativeModules: [],
      },
    });

    const report = compareSnapshots(local, remote);

    expect(report.summary).toBeDefined();
    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.byCategory).toBeDefined();
  });
});
