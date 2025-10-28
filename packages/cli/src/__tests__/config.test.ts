import { describe, it, expect, vi } from 'vitest';
import { loadConfig, generateDefaultConfig } from '../config.js';

describe('Config loader', () => {
  it('should generate default config content', () => {
    const config = generateDefaultConfig();
    
    expect(config).toContain('edgeTarget');
    expect(config).toContain('include');
    expect(config).toContain('exclude');
    expect(config).toContain('rules');
    expect(config).toContain('defineConfig');
  });

  it('should generate valid TypeScript config format', () => {
    const config = generateDefaultConfig();
    
    expect(config).toContain('import');
    expect(config).toContain('export default');
    expect(config).toContain('defineConfig');
  });
});

