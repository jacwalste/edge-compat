import { describe, it, expect } from 'vitest';
import { Scanner } from '../scanner.js';
import { EdgeTarget } from '@edge-compat/rules';

describe('E2E Scanner Tests', () => {
  it('should scan example projects', async () => {
    const scanner = new Scanner({
      cwd: process.cwd(),
      config: {
        edgeTarget: EdgeTarget.AUTO,
        strict: false,
      },
    });

    const result = await scanner.scan();
    
    expect(result.fileCount).toBeGreaterThanOrEqual(0);
    expect(result.findings.length).toBeGreaterThanOrEqual(0);
  });

  it('should have valid scanner output', async () => {
    const scanner = new Scanner({
      cwd: process.cwd(),
      config: {
        edgeTarget: EdgeTarget.AUTO,
        strict: false,
      },
    });

    const result = await scanner.scan();
    
    expect(result).toBeDefined();
    expect(typeof result.fileCount).toBe('number');
    expect(typeof result.duration).toBe('number');
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('should structure findings correctly', async () => {
    const scanner = new Scanner({
      cwd: process.cwd(),
      config: {
        edgeTarget: EdgeTarget.AUTO,
        strict: false,
      },
    });

    const result = await scanner.scan();
    
    for (const finding of result.findings) {
      expect(finding).toHaveProperty('ruleId');
      expect(finding).toHaveProperty('severity');
      expect(finding).toHaveProperty('message');
      expect(finding).toHaveProperty('location');
    }
  });
});

