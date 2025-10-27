import { globby } from 'globby';
import { readFile } from 'node:fs/promises';
import { relative } from 'pathe';
import type { Config, Finding, RuleContext } from '@edge-compat/rules';
import { registry, EdgeTarget } from '@edge-compat/rules';

export interface ScanOptions {
  cwd: string;
  config: Config;
  paths?: string[];
}

export interface ScanResult {
  findings: Finding[];
  fileCount: number;
  duration: number;
}

/**
 * Main scanner implementation
 */
export class Scanner {
  constructor(private options: ScanOptions) {}

  async scan(): Promise<ScanResult> {
    const startTime = performance.now();
    const findings: Finding[] = [];

    // Discover files to scan
    const files = await this.discoverFiles();
    
    console.log(`Scanning ${files.length} files...`);

    // Scan each file
    for (const file of files) {
      const fileFindings = await this.scanFile(file);
      findings.push(...fileFindings);
    }

    const duration = performance.now() - startTime;

    return {
      findings,
      fileCount: files.length,
      duration,
    };
  }

  private async discoverFiles(): Promise<string[]> {
    const { cwd, config, paths } = this.options;

    // Use provided paths or default patterns
    const patterns = paths && paths.length > 0 
      ? paths 
      : config.include || ['**/*.{ts,tsx,js,jsx,mts,mjs,cts,cjs}'];

    const ignore = config.exclude || [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
    ];

    const files = await globby(patterns, {
      cwd,
      ignore,
      absolute: true,
      gitignore: true,
    });

    return files;
  }

  private async scanFile(filePath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    try {
      const fileContent = await readFile(filePath, 'utf-8');

      const context: RuleContext = {
        filePath,
        fileContent,
        edgeTarget: this.options.config.edgeTarget || EdgeTarget.AUTO,
        strict: this.options.config.strict || false,
      };

      // Run all enabled rules
      const rules = registry.getEnabled();

      for (const rule of rules) {
        // Check if rule is disabled in config
        const ruleConfig = this.options.config.rules?.[rule.id];
        if (ruleConfig === 'off') {
          continue;
        }

        const result = await rule.detect(context);
        findings.push(...result.findings);
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to scan ${relative(this.options.cwd, filePath)}: ${(error as Error).message}`,
      );
    }

    return findings;
  }
}

