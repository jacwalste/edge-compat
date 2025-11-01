import { readFile } from 'node:fs/promises';
import { resolve, join } from 'pathe';
import { pathToFileURL } from 'node:url';
import type { Config } from '@edge-compat/rules';
import { ConfigSchema } from '@edge-compat/rules';
import { sanitizeDirectory } from './utils/validation.js';

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
  // Security: Validate and sanitize the working directory path
  const baseDir = sanitizeDirectory(cwd || process.cwd(), process.cwd());
  
  // Try each config file in order
  for (const configFile of CONFIG_FILES) {
    const configPath = resolve(baseDir, configFile);
    
    try {
      let config: unknown;

      if (configFile.endsWith('.json')) {
        // Load JSON config
        // Security: Validate path before reading
        const { validatePath, validateFile } = await import('./utils/validation.js');
        const pathValidation = validatePath(configPath, baseDir);
        if (!pathValidation.valid || !pathValidation.sanitized) {
          continue; // Skip invalid paths
        }
        const fileValidation = await validateFile(pathValidation.sanitized);
        if (!fileValidation.valid) {
          continue; // Skip invalid files
        }
        const content = await readFile(pathValidation.sanitized, 'utf-8');
        config = JSON.parse(content);
      } else {
        // Load JS/TS config (using dynamic import)
        // Security: Validate path before importing
        const { validatePath, validateFile } = await import('./utils/validation.js');
        const pathValidation = validatePath(configPath, baseDir);
        if (!pathValidation.valid || !pathValidation.sanitized) {
          continue; // Skip invalid paths
        }
        const fileValidation = await validateFile(pathValidation.sanitized);
        if (!fileValidation.valid) {
          continue; // Skip invalid files
        }
        const moduleUrl = pathToFileURL(pathValidation.sanitized).href;
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
 * Load config from a specific file path
 */
export async function loadConfigFromFile(configFilePath: string, baseDir: string = process.cwd()): Promise<Config | null> {
  const { validatePath, validateFile } = await import('./utils/validation.js');
  
  // Security: Validate config file path to prevent path traversal
  const pathValidation = validatePath(configFilePath, baseDir);
  if (!pathValidation.valid || !pathValidation.sanitized) {
    throw new Error(`Invalid config file path: ${pathValidation.error}`);
  }
  
  const fileValidation = await validateFile(pathValidation.sanitized);
  if (!fileValidation.valid) {
    throw new Error(`Config file validation failed: ${fileValidation.error}`);
  }
  
  const configPath = pathValidation.sanitized;
  
  try {
    let config: unknown;
    
    if (configPath.endsWith('.json') || configPath.endsWith('.edgecompatrc')) {
      // Load JSON config
      const content = await readFile(configPath, 'utf-8');
      config = JSON.parse(content);
    } else {
      // Load JS/TS config (using dynamic import)
      const moduleUrl = pathToFileURL(configPath).href;
      const module = await import(moduleUrl);
      config = module.default || module;
    }
    
    // Validate config
    const parsed = ConfigSchema.parse(config);
    return parsed;
  } catch (error) {
    throw new Error(
      `Failed to load config from ${configPath}: ${(error as Error).message}`,
    );
  }
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

