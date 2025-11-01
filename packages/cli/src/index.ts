import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'pathe';
import { fileURLToPath } from 'node:url';
import { scanCommand } from './commands/scan.js';
import { fixCommand } from './commands/fix.js';
import { initCommand } from './commands/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
async function getVersion(): Promise<string> {
  try {
    const pkgPath = resolve(__dirname, '../package.json');
    const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function main() {
  const version = await getVersion();
  
  const program = new Command();

  program
    .name('edge-compat')
    .description(
      'CLI scanner for Edge Runtime compatibility issues in JavaScript/TypeScript projects',
    )
    .version(version);

  // Scan command
  program
    .command('scan')
    .description('Scan project for Edge Runtime compatibility issues')
    .argument('[paths...]', 'Paths to scan (defaults to config or cwd)')
    .option('-f, --format <format>', 'Output format (pretty|json|md)', 'pretty')
    .option('-o, --output <file>', 'Output file path')
    .option('--strict', 'Fail on warnings')
    .option(
      '--edge-target <target>',
      'Target edge runtime (next|vercel|cloudflare|deno|auto)',
      'auto',
    )
    .option('-c, --config <path>', 'Path to config file')
    .option('--changed', 'Scan only changed files (git)')
    .option('--watch', 'Watch mode: re-scan on file changes')
    .option('--no-parallel', 'Disable parallel scanning')
    .option('--no-cache', 'Disable caching')
    .option('--no-telemetry', 'Disable telemetry (opt-in only)')
    .action(async (paths, options) => {
      await scanCommand(paths, {
        ...options,
        parallel: options.parallel !== false, // Default true unless --no-parallel
        cache: options.cache !== false, // Default true unless --no-cache
      });
    });

  // Fix command
  program
    .command('fix')
    .description('Automatically fix compatible issues (dry-run by default)')
    .argument('[paths...]', 'Paths to fix (defaults to config or cwd)')
    .option('--rule <id>', 'Only fix specific rule')
    .option('--apply', 'Apply fixes (default is dry-run)')
    .option(
      '--edge-target <target>',
      'Target edge runtime (next|vercel|cloudflare|deno|auto)',
      'auto',
    )
    .action(async (paths, options) => {
      await fixCommand(paths, options);
    });

  // Init command
  program
    .command('init')
    .description('Generate a default configuration file')
    .option('-f, --force', 'Overwrite existing config')
    .action(async (options) => {
      await initCommand(options);
    });

  program.parse();
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

