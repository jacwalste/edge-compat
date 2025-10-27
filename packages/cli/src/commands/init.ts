import { writeFile } from 'node:fs/promises';
import { resolve } from 'pathe';
import { green, cyan } from 'kolorist';
import { generateDefaultConfig } from '../config.js';

export interface InitCommandOptions {
  force?: boolean;
}

export async function initCommand(
  options: InitCommandOptions = {},
): Promise<void> {
  const cwd = process.cwd();
  const configPath = resolve(cwd, 'edgecompat.config.ts');

  try {
    // Check if config already exists
    if (!options.force) {
      try {
        const fs = await import('node:fs/promises');
        await fs.access(configPath);
        console.error(
          `Config file already exists at ${configPath}. Use --force to overwrite.`,
        );
        process.exit(1);
      } catch {
        // File doesn't exist, continue
      }
    }

    // Generate config
    const configContent = generateDefaultConfig();
    await writeFile(configPath, configContent, 'utf-8');

    console.log(green('✓ Created configuration file:'));
    console.log(cyan(`  ${configPath}`));
    console.log('\nYou can now customize the configuration to suit your needs.');
  } catch (error) {
    console.error('Failed to create config file:', error);
    process.exit(2);
  }
}

