import { describe, it, expect } from 'vitest';
import { edgePatternEval, edgePatternWasmSync, edgePatternLongTimers } from '../edge-patterns.js';
import { EdgeTarget } from '../../types.js';

describe('edge-patterns rules', () => {
  const createContext = (fileContent: string) => ({
    filePath: 'test.ts',
    fileContent,
    edgeTarget: EdgeTarget.AUTO,
    strict: false,
  });

  describe('edgePatternEval', () => {
    it('should detect eval() usage', () => {
      const result = edgePatternEval.detect(
        createContext(`const result = eval('1 + 1');`),
      );
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]?.ruleId).toBe('edge/pattern:eval');
    });

    it('should detect new Function()', () => {
      const result = edgePatternEval.detect(
        createContext(`const fn = new Function('a', 'b', 'return a + b');`),
      );
      expect(result.findings).toHaveLength(1);
    });

    it('should not detect Function as type', () => {
      const result = edgePatternEval.detect(
        createContext(`const fn: Function = () => {};`),
      );
      expect(result.findings).toHaveLength(0);
    });
  });

  describe('edgePatternWasmSync', () => {
    it('should detect new WebAssembly.Instance', () => {
      const result = edgePatternWasmSync.detect(
        createContext(`const instance = new WebAssembly.Instance(module);`),
      );
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]?.ruleId).toBe('edge/pattern:wasm-sync');
    });

    it('should detect new WebAssembly.Module', () => {
      const result = edgePatternWasmSync.detect(
        createContext(`const module = new WebAssembly.Module(bytes);`),
      );
      expect(result.findings).toHaveLength(1);
    });
  });

  describe('edgePatternLongTimers', () => {
    it('should detect long setTimeout (> 30s)', () => {
      const result = edgePatternLongTimers.detect(
        createContext(`setTimeout(() => {}, 60000);`),
      );
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]?.ruleId).toBe('edge/pattern:long-timers');
      expect(result.findings[0]?.message).toContain('60000');
    });

    it('should detect long setInterval', () => {
      const result = edgePatternLongTimers.detect(
        createContext(`setInterval(() => {}, 45000);`),
      );
      expect(result.findings).toHaveLength(1);
    });

    it('should not flag short timers', () => {
      const result = edgePatternLongTimers.detect(
        createContext(`setTimeout(() => {}, 5000);`),
      );
      expect(result.findings).toHaveLength(0);
    });

    it('should not flag timers at exactly 30s threshold', () => {
      const result = edgePatternLongTimers.detect(
        createContext(`setTimeout(() => {}, 30000);`),
      );
      expect(result.findings).toHaveLength(0);
    });
  });
});

