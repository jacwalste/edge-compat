import { globby } from 'globby';
import { readFile } from 'node:fs/promises';
import { relative } from 'pathe';
import type { Config, Finding, RuleContext } from '@edge-compat/rules';
import { registry, EdgeTarget } from '@edge-compat/rules';
import { createASTContext } from '@edge-compat/rules';
import { LRUCache, hashContent, getFileMtime, getCacheKey } from './utils/cache.js';
import { getAllChangedFiles } from './utils/git.js';
import type { ScanProgressCallback } from './types.js';

export interface ScanOptions {
  cwd: string;
  config: Config;
  paths?: string[];
  changed?: boolean; // Scan only changed files (git)
  parallel?: boolean; // Use parallel scanning
  maxWorkers?: number; // Max worker threads for parallel scanning
  cache?: boolean; // Enable caching
  progress?: ScanProgressCallback; // Progress callback
}

export interface ScanResult {
  findings: Finding[];
  fileCount: number;
  duration: number;
  cachedCount?: number;
}

/**
 * Main scanner implementation with parallelization, caching, and incremental support
 */
export class Scanner {
  private astCache: LRUCache;
  private fileContentCache: LRUCache;

  constructor(private options: ScanOptions) {
    // Initialize caches (100 file cache by default)
    this.astCache = new LRUCache(100);
    this.fileContentCache = new LRUCache(100);
  }

  async scan(): Promise<ScanResult> {
    const startTime = performance.now();
    const findings: Finding[] = [];

    // Discover files to scan
    let files = await this.discoverFiles();

    // Filter to changed files if requested
    if (this.options.changed) {
      const changedFiles = getAllChangedFiles(this.options.cwd);
      if (changedFiles.length > 0) {
        const changedSet = new Set(changedFiles);
        files = files.filter((file) => changedSet.has(file));
      }
    }

    const fileCount = files.length;
    const cacheEnabled = this.options.cache !== false;

    if (this.options.progress) {
      this.options.progress({
        current: 0,
        total: fileCount,
        message: `Scanning ${fileCount} files...`,
      });
    } else {
      console.log(`Scanning ${fileCount} files...`);
    }

    let cachedCount = 0;

    // Use parallel scanning if enabled and we have multiple files
    if (this.options.parallel && files.length > 1) {
      const maxWorkers = this.options.maxWorkers || Math.min(4, files.length);
      
      // Process files in batches to avoid memory issues
      const batchSize = maxWorkers * 2;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (file, idx) => {
          const fileFindings = await this.scanFileWithCache(file, cacheEnabled);
          if (this.options.progress) {
            this.options.progress({
              current: i + idx + 1,
              total: fileCount,
              message: `Scanning ${relative(this.options.cwd, file)}...`,
            });
          }
          return fileFindings;
        });

        const batchResults = await Promise.all(batchPromises);
        findings.push(...batchResults.flat());
      }
    } else {
      // Sequential scanning
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileFindings = await this.scanFileWithCache(file, cacheEnabled);
        
        if (this.options.progress) {
          this.options.progress({
            current: i + 1,
            total: fileCount,
            message: `Scanning ${relative(this.options.cwd, file)}...`,
          });
        }
        
        findings.push(...fileFindings);
      }
    }

    const duration = performance.now() - startTime;

    return {
      findings,
      fileCount,
      duration,
      cachedCount: cacheEnabled ? cachedCount : undefined,
    };
  }

  private async scanFileWithCache(
    filePath: string,
    useCache: boolean,
  ): Promise<Finding[]> {
    const cacheKey = getCacheKey(filePath);

    // Check cache if enabled
    if (useCache) {
      const mtime = await getFileMtime(filePath);
      const cachedMtime = this.fileContentCache.get(`${cacheKey}:mtime`) as number | undefined;
      
      // If file hasn't changed, return cached results
      if (cachedMtime !== undefined && mtime === cachedMtime) {
        const cachedFindings = this.fileContentCache.get(`${cacheKey}:findings`) as Finding[] | undefined;
        if (cachedFindings) {
          return cachedFindings;
        }
      }
    }

    // Scan file
    const findings = await this.scanFile(filePath);

    // Update cache if enabled
    if (useCache) {
      const mtime = await getFileMtime(filePath);
      this.fileContentCache.set(`${cacheKey}:mtime`, mtime);
      this.fileContentCache.set(`${cacheKey}:findings`, findings);
    }

    return findings;
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

    // Security: Validate file path and size
    const { validatePath, validateFile } = await import('./utils/validation');
    const pathValidation = validatePath(filePath, this.options.cwd);
    if (!pathValidation.valid) {
      console.warn(`Skipping invalid path: ${filePath} - ${pathValidation.error}`);
      return findings;
    }

    const fileValidation = await validateFile(pathValidation.sanitized!);
    if (!fileValidation.valid) {
      console.warn(`Skipping file: ${filePath} - ${fileValidation.error}`);
      return findings;
    }

    try {
      const fileContent = await readFile(filePath, 'utf-8');

      // Create AST context for better detection (falls back to regex if parsing fails)
      const ast = createASTContext(filePath, fileContent);

      const context: RuleContext = {
        filePath,
        fileContent,
        edgeTarget: this.options.config.edgeTarget || EdgeTarget.AUTO,
        strict: this.options.config.strict || false,
        ast: ast || null,
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

