import { readFile } from 'node:fs/promises';
import { resolve, join } from 'pathe';
import { pathToFileURL } from 'node:url';
import type { Config } from '@edge-compat/rules';
import { ConfigSchema } from '@edge-compat/rules';

/**
 * Possible config file names
 */
const CONFIG_FILES = [
  'edgecompat.config.ts',
  'edgecompat.config.mts',
  'edgecompat.config.cts',
  'edgecompat.config.js',
  'edgecompat.config.mjs',
  'edgecompat.config.cjs',
  'edgecompat.config.json',
  '.edgecompatrc.json',
  '.edgecompatrc',
];

/**
 * Load and parse config file
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<Config | null> {
  // Try each config file in order
  for (const configFile of CONFIG_FILES) {
    const configPath = resolve(cwd, configFile);
    
    try {
      let config: unknown;

      if (configFile.endsWith('.json')) {
        // Load JSON config
        const content = await readFile(configPath, 'utf-8');
        config = JSON.parse(content);
      } else {
        // Load JS/TS config (using dynamic import)
        const moduleUrl = pathToFileURL(configPath).href;
        try {
          const module = await import(moduleUrl);
          config = module.default || module;
        } catch (importError) {
          // Check if it's a "file not found" error
          if ((importError as Error).message.includes('Cannot find module')) {
            continue;
          }
          throw importError;
        }
      }

      // Validate config
      const parsed = ConfigSchema.parse(config);
      return parsed;
    } catch (error) {
      // Config file doesn't exist or is invalid, try next one
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue;
      }
      // Check if it's a module not found error
      if ((error as Error).message?.includes('Cannot find module')) {
        continue;
      }
      // If file exists but has parsing errors, throw
      throw new Error(
        `Failed to load config from ${configFile}: ${(error as Error).message}`,
      );
    }
  }

  // No config found, return null (use defaults)
  return null;
}

/**
 * Generate default config file content
 */
export function generateDefaultConfig(): string {
  return `import { defineConfig } from '@edge-compat/rules';

export default defineConfig({
  // Target edge runtime (auto-detect by default)
  // Options: 'next', 'vercel', 'cloudflare', 'deno', 'auto'
  edgeTarget: 'auto',

  // Strict mode: fail on warnings
  strict: false,

  // Include/exclude patterns (glob)
  include: ['src/**/*.{ts,tsx,js,jsx,mts,mjs}'],
  exclude: ['node_modules/**', 'dist/**', '.next/**', 'build/**'],

  // Rule configuration
  rules: {
    // Disable specific rules
    // 'node-core/forbidden-module:fs': 'off',
    
    // Change severity
    // 'node-core/caution:crypto': 'warn',
    
    // Configure with options
    // 'deps/not-edge-safe': {
    //   severity: 'error',
    //   ignore: ['some-package'],
    // },
  },
});
`;
}

