import type { Rule, RuleContext, RuleResult, Finding } from '../types.js';
import { RuleSeverity } from '../types.js';
import { generateCodeFrame } from '../utils/codeframe.js';
import { getReplacement, hasReplacement } from '../recipes/replacements.js';

/**
 * Detect usage of packages that are not Edge-safe
 */
export const depsNotEdgeSafe: Rule = {
  id: 'deps/not-edge-safe',
  name: 'Non-Edge-safe dependency',
  description: 'Dependency that is known to not work in Edge runtimes.',
  category: 'dependency',
  severity: RuleSeverity.ERROR,
  enabled: true,

  detect(context: RuleContext): RuleResult {
    const findings: Finding[] = [];
    const { fileContent, filePath } = context;

    // Pattern to match imports
    const importPattern = /import\s+(?:(?:\w+)|(?:\*\s+as\s+\w+)|(?:\{[^}]+\}))\s+from\s+['"]([@\w-]+(?:\/[@\w-]+)?)['"]/g;
    const requirePattern = /require\s*\(\s*['"]([@\w-]+(?:\/[@\w-]+)?)['"]\s*\)/g;

    const patterns = [importPattern, requirePattern];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(fileContent)) !== null) {
        const packageName = match[1];
        
        if (!packageName) continue;

        // Extract base package name (handle scoped packages)
        const basePackage = packageName.startsWith('@')
          ? packageName.split('/').slice(0, 2).join('/')
          : packageName.split('/')[0];

        if (!basePackage) continue;

        // Check if this package has a known replacement
        if (hasReplacement(basePackage)) {
          const replacement = getReplacement(basePackage);
          if (!replacement) continue;

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
            ruleId: depsNotEdgeSafe.id,
            severity: depsNotEdgeSafe.severity,
            message: `Package "${basePackage}" is not Edge-safe. ${replacement.reason}`,
            location,
            codeFrame: generateCodeFrame(fileContent, location, 2),
            suggestions: [
              {
                message: `Replace with: ${replacement.to}`,
                package: replacement.to,
                importStatement: replacement.installCommand,
                docsUrl: replacement.docsUrl,
              },
              ...(replacement.migrationNotes
                ? [
                    {
                      message: `Migration: ${replacement.migrationNotes}`,
                    },
                  ]
                : []),
            ],
          });
        }
      }
    }

    return { findings };
  },
};

