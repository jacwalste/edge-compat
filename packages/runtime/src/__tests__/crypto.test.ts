import { describe, it, expect } from 'vitest';
import { randomHex, sha256, sha512 } from '../crypto.js';

describe('crypto helpers', () => {
  describe('randomHex', () => {
    it('should generate random hex string', () => {
      const hex = randomHex(16);
      expect(hex).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different values', () => {
      const hex1 = randomHex();
      const hex2 = randomHex();
      expect(hex1).not.toBe(hex2);
    });

    it('should accept custom byte length', () => {
      const hex = randomHex(8);
      expect(hex).toHaveLength(16); // 8 bytes = 16 hex chars
    });
  });

  describe('sha256', () => {
    it('should hash a string', async () => {
      const hash = await sha256('hello world');
      expect(hash).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('should produce consistent hashes', async () => {
      const hash1 = await sha256('test');
      const hash2 = await sha256('test');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await sha256('hello');
      const hash2 = await sha256('world');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('sha512', () => {
    it('should hash a string', async () => {
      const hash = await sha512('hello world');
      expect(hash).toHaveLength(128); // SHA-512 = 64 bytes = 128 hex chars
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('should produce consistent hashes', async () => {
      const hash1 = await sha512('test');
      const hash2 = await sha512('test');
      expect(hash1).toBe(hash2);
    });
  });
});

