/**
 * Tests for snapshot capture
 */

import { describe, it, expect } from 'vitest';
import { captureSnapshot, detectEnvironment, serializeSnapshot, deserializeSnapshot } from '../src/snapshot.js';

describe('Environment Detection', () => {
  it('should detect environment type', () => {
    const env = detectEnvironment();
    expect(env).toBeDefined();
    expect(['local', 'staging', 'production', 'ci', 'docker']).toContain(env);
  });
});

describe('Snapshot Capture', () => {
  it('should capture environment snapshot', async () => {
    const snapshot = await captureSnapshot();

    expect(snapshot).toBeDefined();
    expect(snapshot.timestamp).toBeInstanceOf(Date);
    expect(snapshot.environment).toBeDefined();
    expect(snapshot.nodeVersion).toBeDefined();
    expect(snapshot.dependencies).toBeDefined();
    expect(snapshot.envVars).toBeDefined();
    expect(snapshot.docker).toBeDefined();
    expect(snapshot.system).toBeDefined();
    expect(snapshot.hash).toBeDefined();
  });

  it('should capture Node.js version', async () => {
    const snapshot = await captureSnapshot();

    expect(snapshot.nodeVersion.version).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(snapshot.nodeVersion.platform).toBeDefined();
    expect(snapshot.nodeVersion.arch).toBeDefined();
    expect(snapshot.nodeVersion.npmVersion).toBeDefined();
  });

  it('should redact sensitive environment variables', async () => {
    const snapshot = await captureSnapshot({ redactSensitive: true });

    const redactedKeys = snapshot.envVars.redacted;

    for (const key of redactedKeys) {
      expect(snapshot.envVars.variables[key]).toBe('[REDACTED]');
    }
  });

  it('should generate unique hash', async () => {
    const snapshot = await captureSnapshot();

    expect(snapshot.hash).toBeDefined();
    expect(snapshot.hash.length).toBe(16);
  });
});

describe('Snapshot Serialization', () => {
  it('should serialize snapshot to JSON', async () => {
    const snapshot = await captureSnapshot();
    const serialized = serializeSnapshot(snapshot);

    expect(serialized).toBeDefined();
    expect(typeof serialized).toBe('string');

    const parsed = JSON.parse(serialized);
    expect(parsed.environment).toBe(snapshot.environment);
  });

  it('should deserialize snapshot from JSON', async () => {
    const snapshot = await captureSnapshot();
    const serialized = serializeSnapshot(snapshot);
    const deserialized = deserializeSnapshot(serialized);

    expect(deserialized.timestamp).toBeInstanceOf(Date);
    expect(deserialized.environment).toBe(snapshot.environment);
    expect(deserialized.hash).toBe(snapshot.hash);
  });
});
