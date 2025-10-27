import type { Rule, RuleContext, RuleResult, Finding } from '../types.js';
import { RuleSeverity } from '../types.js';
import { generateCodeFrame } from '../utils/codeframe.js';

/**
 * Detect forbidden Node.js 'fs' module usage in Edge runtime
 */
export const nodeCoreFs: Rule = {
  id: 'node-core/forbidden-module:fs',
  name: 'Forbidden fs module',
  description:
    'The Node.js "fs" module is not available in Edge runtimes. File system access is not supported.',
  category: 'node-core',
  severity: RuleSeverity.ERROR,
  enabled: true,

  detect(context: RuleContext): RuleResult {
    const findings: Finding[] = [];
    const { fileContent, filePath } = context;

    // Regex patterns to detect various forms of fs imports
    const patterns = [
      // ESM imports: import fs from 'fs', import * as fs from 'fs', import { readFile } from 'fs'
      /import\s+(?:(?:\w+)|(?:\*\s+as\s+\w+)|(?:\{[^}]+\}))\s+from\s+['"](?:node:)?fs(?:\/promises)?['"]/g,
      // CJS require: const fs = require('fs'), require('fs/promises')
      /require\s*\(\s*['"](?:node:)?fs(?:\/promises)?['"]\s*\)/g,
      // Dynamic import: import('fs')
      /import\s*\(\s*['"](?:node:)?fs(?:\/promises)?['"]\s*\)/g,
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
          ruleId: nodeCoreFs.id,
          severity: nodeCoreFs.severity,
          message:
            'Usage of Node.js "fs" module detected. File system access is not available in Edge runtimes.',
          location,
          codeFrame: generateCodeFrame(fileContent, location, 2),
          suggestions: [
            {
              message:
                'Remove file system operations or move them to server-side API routes',
              docsUrl:
                'https://vercel.com/docs/concepts/functions/edge-functions/limitations',
            },
            {
              message:
                'For Next.js, use getStaticProps or getServerSideProps for build-time or server-side file access',
              docsUrl: 'https://nextjs.org/docs/basic-features/data-fetching',
            },
            {
              message:
                'For Cloudflare Workers, use Workers KV, R2, or Durable Objects for storage',
              docsUrl:
                'https://developers.cloudflare.com/workers/learning/how-kv-works/',
            },
          ],
        });
      }
    }

    return { findings };
  },
};

