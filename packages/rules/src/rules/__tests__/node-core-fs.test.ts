import { describe, it, expect } from 'vitest';
import { nodeCoreFs } from '../node-core-fs.js';
import { EdgeTarget } from '../../types.js';

describe('nodeCoreFs rule', () => {
  const createContext = (fileContent: string) => ({
    filePath: 'test.ts',
    fileContent,
    edgeTarget: EdgeTarget.AUTO,
    strict: false,
  });

  it('should detect ESM fs import', () => {
    const result = nodeCoreFs.detect(createContext(`import fs from 'fs';`));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.ruleId).toBe('node-core/forbidden-module:fs');
    expect(result.findings[0]?.message).toContain('fs');
  });

  it('should detect ESM fs import with node: prefix', () => {
    const result = nodeCoreFs.detect(createContext(`import fs from 'node:fs';`));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.ruleId).toBe('node-core/forbidden-module:fs');
  });

  it('should detect named imports', () => {
    const result = nodeCoreFs.detect(
      createContext(`import { readFile, writeFile } from 'fs';`),
    );
    expect(result.findings).toHaveLength(1);
  });

  it('should detect namespace imports', () => {
    const result = nodeCoreFs.detect(createContext(`import * as fs from 'fs';`));
    expect(result.findings).toHaveLength(1);
  });

  it('should detect fs/promises', () => {
    const result = nodeCoreFs.detect(
      createContext(`import { readFile } from 'fs/promises';`),
    );
    expect(result.findings).toHaveLength(1);
  });

  it('should detect CJS require', () => {
    const result = nodeCoreFs.detect(createContext(`const fs = require('fs');`));
    expect(result.findings).toHaveLength(1);
  });

  it('should detect dynamic import', () => {
    const result = nodeCoreFs.detect(createContext(`const fs = await import('fs');`));
    expect(result.findings).toHaveLength(1);
  });

  it('should not detect non-fs imports', () => {
    const result = nodeCoreFs.detect(
      createContext(`import path from 'path';\nimport { readFile } from 'my-fs-lib';`),
    );
    expect(result.findings).toHaveLength(0);
  });

  it('should provide suggestions', () => {
    const result = nodeCoreFs.detect(createContext(`import fs from 'fs';`));
    expect(result.findings[0]?.suggestions).toBeDefined();
    expect(result.findings[0]?.suggestions?.length).toBeGreaterThan(0);
  });

  it('should include code frame', () => {
    const result = nodeCoreFs.detect(createContext(`import fs from 'fs';`));
    expect(result.findings[0]?.codeFrame).toBeDefined();
    expect(result.findings[0]?.codeFrame?.code).toContain('import fs');
  });
});

