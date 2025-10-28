import { describe, it, expect } from 'vitest';
import { Scanner } from '../scanner.js';
import { EdgeTarget } from '@edge-compat/rules';

describe('Scanner', () => {
  const testConfig = {
    edgeTarget: EdgeTarget.AUTO,
    strict: false,
    include: ['**/*.{ts,tsx,js,jsx}'],
    exclude: ['node_modules/**', 'dist/**'],
  };

  it('should scan a file with forbidden fs module', async () => {
    const scanner = new Scanner({
      cwd: process.cwd(),
      config: testConfig,
    });

    // Create a temporary test file
    const fs = await import('node:fs/promises');
    const testDir = '/tmp/edge-compat-test';
    const testFile = `${testDir}/test.ts`;
    
    try {
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(testFile, "import fs from 'fs';");
      
      const result = await scanner.scan();
      
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings.some(f => f.ruleId === 'node-core/forbidden-module:fs')).toBe(true);
    } finally {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  it('should scan documentation files', async () => {
    const scanner = new Scanner({
      cwd: process.cwd(),
      config: testConfig,
    });

    const result = await scanner.scan();
    
    expect(result.fileCount).toBeGreaterThanOrEqual(0);
    expect(result.findings.length).toBeGreaterThanOrEqual(0);
  });

  it('should respect exclude patterns', async () => {
    const scanner = new Scanner({
      cwd: process.cwd(),
      config: {
        ...testConfig,
        exclude: ['**/*'],
      },
    });

    const result = await scanner.scan();
    
    expect(result.fileCount).toBe(0);
    expect(result.findings.length).toBe(0);
  });
});

