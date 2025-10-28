import { describe, it, expect, vi, afterEach } from 'vitest';
import { MarkdownReporter } from '../markdown.js';
import { RuleSeverity } from '@edge-compat/rules';
import type { Finding } from '@edge-compat/rules';
import { unlink } from 'node:fs/promises';

describe('MarkdownReporter', () => {
  const reporter = new MarkdownReporter();
  const testFile = '/tmp/test-report.md';

  afterEach(async () => {
    try {
      await unlink(testFile);
    } catch {
      // Ignore
    }
  });

  it('should generate markdown report file', async () => {
    const findings: Finding[] = [
      {
        ruleId: 'test/rule',
        severity: RuleSeverity.ERROR,
        message: 'Test error message',
        location: {
          file: 'src/test.ts',
          line: 10,
          column: 5,
        },
        codeFrame: {
          code: '  import fs from \'fs\';',
          location: {
            file: 'src/test.ts',
            line: 10,
            column: 5,
          },
        },
        suggestions: [
          {
            message: 'Fix suggestion',
            docsUrl: 'https://example.com',
          },
        ],
      },
    ];

    await reporter.report({
      findings,
      fileCount: 1,
      duration: 100,
    }, {
      cwd: '/tmp',
      outputFile: testFile,
    });

    const fs = await import('node:fs/promises');
    const content = await fs.readFile(testFile, 'utf-8');
    
    expect(content).toContain('# Edge Compatibility Report');
    expect(content).toContain('Test error message');
    expect(content).toContain('test/rule');
    expect(content).toContain('Fix suggestion');
  });

  it('should handle empty findings', async () => {
    await reporter.report({
      findings: [],
      fileCount: 0,
      duration: 0,
    }, {
      cwd: '/tmp',
      outputFile: testFile,
    });

    const fs = await import('node:fs/promises');
    const content = await fs.readFile(testFile, 'utf-8');
    
    expect(content).toContain('No Issues Found');
  });
});

