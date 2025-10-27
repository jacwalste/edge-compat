import { resolve } from 'pathe';
import ora from 'ora';
import { loadConfig } from '../config.js';
import { Scanner } from '../scanner.js';
import { getReporter, type ReporterFormat } from '../reporters/index.js';
import type { Config } from '@edge-compat/rules';
import { RuleSeverity, EdgeTarget } from '@edge-compat/rules';

export interface ScanCommandOptions {
  format?: ReporterFormat;
  output?: string;
  strict?: boolean;
  edgeTarget?: 'next' | 'vercel' | 'cloudflare' | 'deno' | 'auto';
  config?: string;
}

export async function scanCommand(
  paths: string[] = [],
  options: ScanCommandOptions = {},
): Promise<void> {
  const cwd = process.cwd();
  const spinner = ora('Loading configuration...').start();

  try {
    // Load config
    let config: Config | null = null;
    
    if (options.config) {
      const configPath = resolve(cwd, options.config);
      spinner.text = `Loading config from ${options.config}...`;
      // TODO: Load from specific path
      config = await loadConfig(cwd);
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

    // Run scan
    spinner.start('Scanning files...');
    
    const scanner = new Scanner({
      cwd,
      config: finalConfig,
      paths: paths.length > 0 ? paths : undefined,
    });

    const result = await scanner.scan();
    spinner.stop();

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

