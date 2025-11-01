import { resolve } from 'pathe';
import ora from 'ora';
import { loadConfig, loadConfigFromFile } from '../config.js';
import { Scanner } from '../scanner.js';
import { getReporter, type ReporterFormat } from '../reporters/index.js';
import type { Config } from '@edge-compat/rules';
import { RuleSeverity, EdgeTarget } from '@edge-compat/rules';
import { runWatchMode } from './watch.js';

export interface ScanCommandOptions {
  format?: ReporterFormat;
  output?: string;
  strict?: boolean;
  edgeTarget?: 'next' | 'vercel' | 'cloudflare' | 'deno' | 'auto';
  config?: string;
  changed?: boolean; // Scan only changed files (git)
  parallel?: boolean; // Enable parallel scanning
  watch?: boolean; // Watch mode
  cache?: boolean; // Enable caching
}

export async function scanCommand(
  paths: string[] = [],
  options: ScanCommandOptions = {},
): Promise<void> {
  // Validate edgeTarget
  if (options.edgeTarget && !['next', 'vercel', 'cloudflare', 'deno', 'auto'].includes(options.edgeTarget)) {
    throw new Error(`Invalid edgeTarget: ${options.edgeTarget}. Must be one of: next, vercel, cloudflare, deno, auto`);
  }

  // Validate format
  if (options.format && !['pretty', 'json', 'md'].includes(options.format)) {
    throw new Error(`Invalid format: ${options.format}. Must be one of: pretty, json, md`);
  }

  // Validate paths input
  for (const path of paths) {
    if (typeof path !== 'string' || path.trim().length === 0) {
      throw new Error('Invalid path provided - paths must be non-empty strings');
    }
  }

  const cwd = process.cwd();
  const spinner = ora('Loading configuration...').start();

  try {
    // Load config
    let config: Config | null = null;
    
    if (options.config) {
      // Security: Validate config file path to prevent path traversal
      const configFilePath = resolve(cwd, options.config);
      spinner.text = `Loading config from ${options.config}...`;
      config = await loadConfigFromFile(configFilePath, cwd);
    } else {
      config = await loadConfig(cwd);
    }

    // Apply CLI overrides
    const finalConfig: Config = {
      ...config,
      strict: options.strict ?? config?.strict ?? false,
      edgeTarget: options.edgeTarget 
        ? (EdgeTarget[options.edgeTarget.toUpperCase() as keyof typeof EdgeTarget] || EdgeTarget.AUTO)
        : config?.edgeTarget ?? EdgeTarget.AUTO,
    };

    spinner.succeed('Configuration loaded');

    // Handle watch mode
    if (options.watch) {
      return runWatchMode({
        cwd,
        config: finalConfig,
        paths: paths.length > 0 ? paths : undefined,
        format: options.format || 'pretty',
        output: options.output,
      });
    }

    // Run scan with progress indicator
    spinner.start('Scanning files...');
    
    let lastMessage = '';
    const scanner = new Scanner({
      cwd,
      config: finalConfig,
      paths: paths.length > 0 ? paths : undefined,
      changed: options.changed,
      parallel: options.parallel ?? true, // Default to parallel for better performance
      cache: options.cache ?? true, // Default to enabled
      progress: (progress) => {
        const message = progress.message || `Scanning ${progress.current}/${progress.total} files...`;
        if (message !== lastMessage) {
          spinner.text = message;
          lastMessage = message;
        }
      },
    });

    const result = await scanner.scan();
    spinner.stop();

    if (result.cachedCount !== undefined) {
      console.log(`\nScanned ${result.fileCount} files (cached: ${result.cachedCount}) in ${(result.duration / 1000).toFixed(2)}s`);
    } else {
      console.log(`\nScanned ${result.fileCount} files in ${(result.duration / 1000).toFixed(2)}s`);
    }

    // Report results
    const format = options.format || 'pretty';
    const reporter = getReporter(format);

    await reporter.report(result, {
      cwd,
      outputFile: options.output,
    });

    // Determine exit code
    const hasErrors = result.findings.some(
      (f) => f.severity === RuleSeverity.ERROR,
    );
    const hasWarnings = result.findings.some(
      (f) => f.severity === RuleSeverity.WARNING,
    );

    if (hasErrors) {
      process.exit(2);
    } else if (finalConfig.strict && hasWarnings) {
      process.exit(2);
    } else if (result.findings.length > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    spinner.fail('Scan failed');
    console.error(error);
    process.exit(2);
  }
}

