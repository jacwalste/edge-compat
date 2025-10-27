import type { Rule, RuleContext, RuleResult, Finding } from '../types.js';
import { RuleSeverity } from '../types.js';
import { generateCodeFrame } from '../utils/codeframe.js';

/**
 * Create a forbidden Node core module rule
 */
function createForbiddenModuleRule(
  moduleName: string,
  description: string,
  suggestions: Array<{ message: string; docsUrl?: string; importStatement?: string; package?: string }>,
): Rule {
  return {
    id: `node-core/forbidden-module:${moduleName}`,
    name: `Forbidden ${moduleName} module`,
    description,
    category: 'node-core',
    severity: RuleSeverity.ERROR,
    enabled: true,

    detect(context: RuleContext): RuleResult {
      const findings: Finding[] = [];
      const { fileContent, filePath } = context;

      const patterns = [
        new RegExp(
          `import\\s+(?:(?:\\w+)|(?:\\*\\s+as\\s+\\w+)|(?:\\{[^}]+\\}))\\s+from\\s+['"](?:node:)?${moduleName}(?:\\/[\\w-]+)?['"]`,
          'g',
        ),
        new RegExp(
          `require\\s*\\(\\s*['"](?:node:)?${moduleName}(?:\\/[\\w-]+)?['"]\\s*\\)`,
          'g',
        ),
        new RegExp(
          `import\\s*\\(\\s*['"](?:node:)?${moduleName}(?:\\/[\\w-]+)?['"]\\s*\\)`,
          'g',
        ),
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
            ruleId: `node-core/forbidden-module:${moduleName}`,
            severity: RuleSeverity.ERROR,
            message: `Usage of Node.js "${moduleName}" module detected. ${description}`,
            location,
            codeFrame: generateCodeFrame(fileContent, location, 2),
            suggestions,
          });
        }
      }

      return { findings };
    },
  };
}

// Common forbidden modules
export const nodeCoreNet = createForbiddenModuleRule(
  'net',
  'Network sockets are not available in Edge runtimes.',
  [
    {
      message: 'Use fetch() or WebSocket for network communication',
    },
    {
      message: 'For Cloudflare Workers, use TCP sockets from the runtime API',
      docsUrl: 'https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/',
    },
  ],
);

export const nodeCoreTls = createForbiddenModuleRule(
  'tls',
  'TLS sockets are not available in Edge runtimes.',
  [
    {
      message: 'Use fetch() with HTTPS URLs instead',
    },
  ],
);

export const nodeCoreChildProcess = createForbiddenModuleRule(
  'child_process',
  'Child processes are not supported in Edge runtimes.',
  [
    {
      message: 'Move process execution to server-side API routes or background jobs',
    },
  ],
);

export const nodeCoreCluster = createForbiddenModuleRule(
  'cluster',
  'Cluster module is not available in Edge runtimes.',
  [
    {
      message: 'Edge runtimes handle scaling automatically',
    },
  ],
);

export const nodeCoreWorkerThreads = createForbiddenModuleRule(
  'worker_threads',
  'Worker threads are not available in Edge runtimes.',
  [
    {
      message: 'Use Web Workers API or Cloudflare Durable Objects for parallel execution',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API',
    },
  ],
);

export const nodeCoreDns = createForbiddenModuleRule(
  'dns',
  'DNS module is not available in Edge runtimes.',
  [
    {
      message: 'Use fetch() or external DNS-over-HTTPS services',
    },
  ],
);

export const nodeCoreModule = createForbiddenModuleRule(
  'module',
  'Module system internals are not available in Edge runtimes.',
  [
    {
      message: 'Use standard ESM imports instead of dynamic module manipulation',
    },
  ],
);

export const nodeCoreVm = createForbiddenModuleRule(
  'vm',
  'VM module is not available in Edge runtimes.',
  [
    {
      message: 'Avoid dynamic code execution; use static imports and eval alternatives',
    },
  ],
);

export const nodeCorePerfHooks = createForbiddenModuleRule(
  'perf_hooks',
  'Performance hooks are not available in Edge runtimes.',
  [
    {
      message: 'Use Performance API (performance.now(), PerformanceMark) instead',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Performance',
    },
  ],
);

export const nodeCoreReadline = createForbiddenModuleRule(
  'readline',
  'Readline module is not available in Edge runtimes.',
  [
    {
      message: 'Edge functions do not support interactive I/O',
    },
  ],
);

export const nodeCoreRepl = createForbiddenModuleRule(
  'repl',
  'REPL is not available in Edge runtimes.',
  [
    {
      message: 'Edge functions do not support interactive execution',
    },
  ],
);

export const nodeCoreZlib = createForbiddenModuleRule(
  'zlib',
  'Zlib module is not available in most Edge runtimes.',
  [
    {
      message: 'Use CompressionStream and DecompressionStream (Web Streams API)',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream',
      importStatement: "const compressed = await new Response(stream.pipeThrough(new CompressionStream('gzip'))).blob();",
    },
  ],
);

