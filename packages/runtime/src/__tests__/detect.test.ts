import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isEdge, getEdgeRuntime } from '../detect.js';

describe('isEdge', () => {
  let originalProcess: typeof process | undefined;
  let originalGlobalThis: typeof globalThis;

  beforeEach(() => {
    originalProcess = typeof process !== 'undefined' ? { ...process } : undefined;
    originalGlobalThis = { ...globalThis };
  });

  afterEach(() => {
    // Reset globals
    if (originalProcess) {
      (globalThis as any).process = originalProcess;
    }
  });

  it('should return false in Node.js environment', () => {
    expect(isEdge()).toBe(false);
  });

  it('should respect explicit flag', () => {
    expect(isEdge(true)).toBe(true);
    expect(isEdge(false)).toBe(false);
  });

  it('should detect EDGE_RUNTIME env var', () => {
    if (typeof process !== 'undefined') {
      process.env.EDGE_RUNTIME = 'true';
      expect(isEdge()).toBe(true);
      delete process.env.EDGE_RUNTIME;
    }
  });
});

describe('getEdgeRuntime', () => {
  it('should return null in Node.js', () => {
    expect(getEdgeRuntime()).toBeNull();
  });

  it('should return null when not in Edge', () => {
    expect(getEdgeRuntime()).toBeNull();
  });
});

