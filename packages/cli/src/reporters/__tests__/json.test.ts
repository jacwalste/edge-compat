import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JsonReporter } from '../json.js';
import { RuleSeverity } from '@edge-compat/rules';
import type { Finding } from '@edge-compat/rules';
import { writeFile } from 'node:fs/promises';
import { unlink } from 'node:fs/promises';

describe('JsonReporter', () => {
  const reporter = new JsonReporter();
  const testFile = '/tmp/test-output.json';

  afterEach(async () => {
    try {
      await unlink(testFile);
    } catch {
      // Ignore
    }
  });

  it('should output JSON to file when outputFile is provided', async () => {
    const findings: Finding[] = [
      {
        ruleId: 'test/rule',
        severity: RuleSeverity.ERROR,
        message: 'Test error',
        location: {
          file: '/tmp/test.ts',
          line: 1,
          column: 0,
        },
      },
    ];

    await reporter.report({
      findings,
      fileCount: 1,
      duration: 50,
    }, {
      cwd: '/tmp',
      outputFile: testFile,
    });

    const content = await import('node:fs/promises').then(fs => 
      fs.readFile(testFile, 'utf-8')
    );
    
    const parsed = JSON.parse(content);
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0].ruleId).toBe('test/rule');
  });

  it('should output JSON to console when no outputFile', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const findings: Finding[] = [];

    await reporter.report({
      findings,
      fileCount: 0,
      duration: 0,
    }, {
      cwd: '/tmp',
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    
    const output = consoleLogSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.findings).toEqual([]);
    expect(parsed.fileCount).toBe(0);
    
    consoleLogSpy.mockRestore();
  });
});

