import { watch } from 'node:fs/promises';
import { relative } from 'pathe';
import { Scanner } from '../scanner.js';
import { getReporter } from '../reporters/index.js';
import type { Config } from '@edge-compat/rules';
import { RuleSeverity } from '@edge-compat/rules';
import type { ReporterFormat } from '../reporters/index.js';

interface WatchOptions {
  cwd: string;
  config: Config;
  paths?: string[];
  format?: ReporterFormat;
  output?: string;
}

/**
 * Run scanner in watch mode
 */
export async function runWatchMode(options: WatchOptions): Promise<void> {
  const { cwd, config, paths, format = 'pretty', output } = options;

  console.log('🔍 Watching for file changes...');
  console.log('Press Ctrl+C to stop\n');

  const scanner = new Scanner({
    cwd,
    config,
    paths,
    parallel: true,
    cache: true,
  });

  // Initial scan
  console.log('Running initial scan...');
  let result = await scanner.scan();
  const reporter = getReporter(format);

  if (result.findings.length > 0) {
    await reporter.report(result, { cwd, outputFile: output });
  } else {
    console.log('✓ No issues found\n');
  }

  // Watch for changes
  try {
    const patterns = paths && paths.length > 0 
      ? paths 
      : config.include || ['**/*.{ts,tsx,js,jsx,mts,mjs,cts,cjs}'];

    // Watch the entire directory for simplicity
    const watcher = watch(cwd, { recursive: true });
    const changedFiles = new Set<string>();

    // Debounce scan to avoid too many scans
    let scanTimeout: NodeJS.Timeout | null = null;

    for await (const event of watcher) {
      if (event.eventType === 'change' || event.eventType === 'rename') {
        const filePath = `${cwd}/${event.filename}`;
        
        // Check if file matches our patterns
        const matches = patterns.some((pattern) => {
          // Simple pattern matching (globby handles more complex cases)
          return filePath.includes(pattern.replace(/\*\*/g, '').replace(/\*/g, ''));
        });

        if (matches) {
          changedFiles.add(filePath);
          
          // Debounce: wait 500ms after last change
          if (scanTimeout) {
            clearTimeout(scanTimeout);
          }

          scanTimeout = setTimeout(async () => {
            console.log(`\n📝 File changed: ${relative(cwd, filePath)}`);
            console.log('Re-scanning...\n');

            // Scan only changed files for faster feedback
            const changedFilesArray = Array.from(changedFiles);
            changedFiles.clear();

            const incrementalScanner = new Scanner({
              cwd,
              config,
              paths: changedFilesArray,
              parallel: true,
              cache: true,
            });

            const newResult = await incrementalScanner.scan();
            
            if (newResult.findings.length > 0) {
              await reporter.report(newResult, { cwd, outputFile: output });
            } else {
              console.log('✓ No issues found\n');
            }
          }, 500);
        }
      }
    }
  } catch (error) {
    if ((error as any).code === 'ENOSYS') {
      console.error('Watch mode is not supported on this system');
      process.exit(1);
    } else {
      throw error;
    }
  }
}

