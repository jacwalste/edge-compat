import { describe, it, expect } from 'vitest';
import { PrettyReporter } from '../pretty.js';
import { RuleSeverity } from '@edge-compat/rules';
import type { Finding } from '@edge-compat/rules';

describe('PrettyReporter', () => {
  const reporter = new PrettyReporter();

  it('should handle empty findings gracefully', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    reporter.report({
      findings: [],
      fileCount: 5,
      duration: 100,
    }, {
      cwd: '/tmp/test',
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  it('should report findings with correct severity', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
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

    reporter.report({
      findings,
      fileCount: 1,
      duration: 50,
    }, {
      cwd: '/tmp',
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy.mock.calls.some(call => 
      call[0]?.toString().includes('Test error')
    )).toBe(true);
    
    consoleLogSpy.mockRestore();
  });
});

