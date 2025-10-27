import type { Rule, RuleContext, RuleResult, Finding } from '../types.js';
import { RuleSeverity } from '../types.js';
import { generateCodeFrame } from '../utils/codeframe.js';

/**
 * Detect eval() usage
 */
export const edgePatternEval: Rule = {
  id: 'edge/pattern:eval',
  name: 'Eval usage detected',
  description: 'Usage of eval() or new Function() is discouraged in Edge runtimes for security and performance.',
  category: 'edge-pattern',
  severity: RuleSeverity.ERROR,
  enabled: true,

  detect(context: RuleContext): RuleResult {
    const findings: Finding[] = [];
    const { fileContent, filePath } = context;

    // Match eval() and new Function()
    const patterns = [
      /\beval\s*\(/g,
      /new\s+Function\s*\(/g,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(fileContent)) !== null) {
        const matchText = match[0];
        const startPos = match.index;
        const lines = fileContent.slice(0, startPos).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1]?.length ?? 0;

        const location = {
          file: filePath,
          line,
          column,
          endLine: line,
          endColumn: column + matchText.length,
        };

        findings.push({
          ruleId: edgePatternEval.id,
          severity: edgePatternEval.severity,
          message: 'Dynamic code execution with eval() or new Function() is not allowed in many Edge runtimes.',
          location,
          codeFrame: generateCodeFrame(fileContent, location, 2),
          suggestions: [
            {
              message: 'Refactor to use static code and imports',
            },
            {
              message: 'Consider alternative patterns like configuration objects or strategy pattern',
            },
          ],
        });
      }
    }

    return { findings };
  },
};

/**
 * Detect synchronous WASM instantiation
 */
export const edgePatternWasmSync: Rule = {
  id: 'edge/pattern:wasm-sync',
  name: 'Synchronous WASM instantiation',
  description: 'Synchronous WASM instantiation may not work in Edge runtimes.',
  category: 'edge-pattern',
  severity: RuleSeverity.WARNING,
  enabled: true,

  detect(context: RuleContext): RuleResult {
    const findings: Finding[] = [];
    const { fileContent, filePath } = context;

    const patterns = [
      /new\s+WebAssembly\.Instance\s*\(/g,
      /new\s+WebAssembly\.Module\s*\(/g,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(fileContent)) !== null) {
        const matchText = match[0];
        const startPos = match.index;
        const lines = fileContent.slice(0, startPos).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1]?.length ?? 0;

        const location = {
          file: filePath,
          line,
          column,
          endLine: line,
          endColumn: column + matchText.length,
        };

        findings.push({
          ruleId: edgePatternWasmSync.id,
          severity: edgePatternWasmSync.severity,
          message: 'Synchronous WASM instantiation detected. Use async methods for Edge compatibility.',
          location,
          codeFrame: generateCodeFrame(fileContent, location, 2),
          suggestions: [
            {
              message: 'Use WebAssembly.instantiate() or WebAssembly.compile() (async)',
              importStatement: 'const module = await WebAssembly.instantiate(wasmBytes);',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate',
            },
          ],
        });
      }
    }

    return { findings };
  },
};

/**
 * Detect long-running timers in middleware
 */
export const edgePatternLongTimers: Rule = {
  id: 'edge/pattern:long-timers',
  name: 'Long-running timers',
  description: 'Long setTimeout/setInterval delays may not work reliably in Edge runtimes.',
  category: 'edge-pattern',
  severity: RuleSeverity.WARNING,
  enabled: true,

  detect(context: RuleContext): RuleResult {
    const findings: Finding[] = [];
    const { fileContent, filePath } = context;

    // Match setTimeout/setInterval with large delays (> 30 seconds = 30000ms)
    const pattern = /\b(setTimeout|setInterval)\s*\([^,]+,\s*(\d+)\s*\)/g;

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(fileContent)) !== null) {
      const delay = parseInt(match[2] ?? '0', 10);
      
      if (delay > 30000) {
        const matchText = match[0];
        const startPos = match.index;
        const lines = fileContent.slice(0, startPos).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1]?.length ?? 0;

        const location = {
          file: filePath,
          line,
          column,
          endLine: line,
          endColumn: column + matchText.length,
        };

        findings.push({
          ruleId: edgePatternLongTimers.id,
          severity: edgePatternLongTimers.severity,
          message: `${match[1]} with delay of ${delay}ms detected. Edge functions typically have execution time limits.`,
          location,
          codeFrame: generateCodeFrame(fileContent, location, 2),
          suggestions: [
            {
              message: 'Use task queues or scheduled functions for delayed execution',
            },
            {
              message: 'Vercel: Use Vercel Cron Jobs',
              docsUrl: 'https://vercel.com/docs/cron-jobs',
            },
            {
              message: 'Cloudflare: Use Durable Objects or scheduled Workers',
              docsUrl: 'https://developers.cloudflare.com/workers/configuration/cron-triggers/',
            },
          ],
        });
      }
    }

    return { findings };
  },
};

