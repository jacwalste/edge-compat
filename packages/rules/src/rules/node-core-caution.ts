import type { Rule, RuleContext, RuleResult, Finding } from '../types.js';
import { RuleSeverity } from '../types.js';
import { generateCodeFrame } from '../utils/codeframe.js';

/**
 * Caution: crypto module usage
 * Not forbidden but should prefer Web Crypto
 */
export const nodeCoreCrypto: Rule = {
  id: 'node-core/caution:crypto',
  name: 'Node.js crypto module usage',
  description: 'Node.js crypto module detected. Prefer Web Crypto API for Edge compatibility.',
  category: 'node-core',
  severity: RuleSeverity.WARNING,
  enabled: true,

  detect(context: RuleContext): RuleResult {
    const findings: Finding[] = [];
    const { fileContent, filePath } = context;

    const patterns = [
      /import\s+(?:(?:\w+)|(?:\*\s+as\s+\w+)|(?:\{[^}]+\}))\s+from\s+['"](?:node:)?crypto['"]/g,
      /require\s*\(\s*['"](?:node:)?crypto['"]\s*\)/g,
      /import\s*\(\s*['"](?:node:)?crypto['"]\s*\)/g,
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
          ruleId: nodeCoreCrypto.id,
          severity: nodeCoreCrypto.severity,
          message: 'Node.js crypto module usage detected. Consider using Web Crypto API for better Edge compatibility.',
          location,
          codeFrame: generateCodeFrame(fileContent, location, 2),
          suggestions: [
            {
              message: 'Use Web Crypto API (crypto.subtle) instead',
              importStatement: 'const hash = await crypto.subtle.digest("SHA-256", data);',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API',
            },
            {
              message: 'For JWT operations, use the "jose" library',
              package: 'jose',
              importStatement: 'import * as jose from "jose";',
              docsUrl: 'https://github.com/panva/jose',
            },
          ],
        });
      }
    }

    return { findings };
  },
};

/**
 * Caution: buffer module usage
 */
export const nodeCoreBuffer: Rule = {
  id: 'node-core/caution:buffer',
  name: 'Node.js Buffer usage',
  description: 'Node.js Buffer detected. Prefer Uint8Array and Web APIs for Edge compatibility.',
  category: 'node-core',
  severity: RuleSeverity.WARNING,
  enabled: true,

  detect(context: RuleContext): RuleResult {
    const findings: Finding[] = [];
    const { fileContent, filePath } = context;

    const patterns = [
      /import\s+(?:(?:\w+)|(?:\*\s+as\s+\w+)|(?:\{[^}]+\}))\s+from\s+['"](?:node:)?buffer['"]/g,
      /require\s*\(\s*['"](?:node:)?buffer['"]\s*\)/g,
      /\bBuffer\.(from|alloc|allocUnsafe|concat)\s*\(/g,
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
          ruleId: nodeCoreBuffer.id,
          severity: nodeCoreBuffer.severity,
          message: 'Node.js Buffer usage detected. Prefer Uint8Array and Web APIs for Edge compatibility.',
          location,
          codeFrame: generateCodeFrame(fileContent, location, 2),
          suggestions: [
            {
              message: 'Use Uint8Array instead of Buffer',
              importStatement: 'const bytes = new Uint8Array([1, 2, 3]);',
            },
            {
              message: 'Use TextEncoder/TextDecoder for string conversion',
              importStatement: 'const encoder = new TextEncoder(); const bytes = encoder.encode("hello");',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder',
            },
          ],
        });
      }
    }

    return { findings };
  },
};

/**
 * Caution: streams module usage
 */
export const nodeCoreStreams: Rule = {
  id: 'node-core/caution:stream',
  name: 'Node.js streams usage',
  description: 'Node.js streams detected. Prefer Web Streams API for Edge compatibility.',
  category: 'node-core',
  severity: RuleSeverity.WARNING,
  enabled: true,

  detect(context: RuleContext): RuleResult {
    const findings: Finding[] = [];
    const { fileContent, filePath } = context;

    const patterns = [
      /import\s+(?:(?:\w+)|(?:\*\s+as\s+\w+)|(?:\{[^}]+\}))\s+from\s+['"](?:node:)?stream['"]/g,
      /require\s*\(\s*['"](?:node:)?stream['"]\s*\)/g,
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
          ruleId: nodeCoreStreams.id,
          severity: nodeCoreStreams.severity,
          message: 'Node.js streams module usage detected. Consider using Web Streams API for Edge compatibility.',
          location,
          codeFrame: generateCodeFrame(fileContent, location, 2),
          suggestions: [
            {
              message: 'Use ReadableStream, WritableStream, and TransformStream',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Streams_API',
            },
            {
              message: 'For Node.js stream compatibility in Edge, consider stream adapters',
            },
          ],
        });
      }
    }

    return { findings };
  },
};

