/**
 * Environment variables validator
 */

import type { EnvironmentVariables } from '../types.js';

/**
 * Patterns for sensitive environment variables
 */
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /private[_-]?key/i,
  /database[_-]?url/i,
  /db[_-]?url/i,
  /connection[_-]?string/i,
  /auth/i,
  /credential/i,
  /access[_-]?key/i,
];

/**
 * Capture environment variables with optional redaction
 */
export function captureEnvVars(options: {
  redactSensitive?: boolean;
} = {}): EnvironmentVariables {
  const { redactSensitive = true } = options;

  const variables: Record<string, string> = {};
  const redacted: string[] = [];

  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;

    const isSensitive = redactSensitive && SENSITIVE_PATTERNS.some(p => p.test(key));

    if (isSensitive) {
      variables[key] = '[REDACTED]';
      redacted.push(key);
    } else {
      variables[key] = value;
    }
  }

  return { variables, redacted };
}

/**
 * Compare environment variables
 */
export function compareEnvVars(
  local: EnvironmentVariables,
  remote: EnvironmentVariables
): {
  missing: string[];
  extra: string[];
  different: string[];
} {
  const localKeys = new Set(Object.keys(local.variables));
  const remoteKeys = new Set(Object.keys(remote.variables));

  const missing: string[] = [];
  const extra: string[] = [];
  const different: string[] = [];

  // Find missing vars (in remote but not local)
  for (const key of remoteKeys) {
    if (!localKeys.has(key)) {
      missing.push(key);
    }
  }

  // Find extra vars (in local but not remote)
  for (const key of localKeys) {
    if (!remoteKeys.has(key)) {
      extra.push(key);
    }
  }

  // Find different values (skip redacted)
  for (const key of localKeys) {
    if (remoteKeys.has(key)) {
      const localVal = local.variables[key];
      const remoteVal = remote.variables[key];

      if (localVal !== remoteVal && localVal !== '[REDACTED]' && remoteVal !== '[REDACTED]') {
        different.push(key);
      }
    }
  }

  return { missing, extra, different };
}
