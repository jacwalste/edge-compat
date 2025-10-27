import { assertWebCrypto } from './assert.js';

/**
 * Safe wrapper around Web Crypto API
 * Throws helpful error if not available
 */
export const safeCrypto = {
  get subtle() {
    assertWebCrypto();
    return globalThis.crypto.subtle;
  },

  /**
   * Generate a random UUID using crypto.randomUUID()
   */
  randomUUID(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    throw new Error(
      'crypto.randomUUID() is not available. Use a polyfill or update your runtime.',
    );
  },

  /**
   * Get cryptographically secure random values
   */
  getRandomValues<T extends ArrayBufferView>(array: T): T {
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      return globalThis.crypto.getRandomValues(array);
    }
    throw new Error(
      'crypto.getRandomValues() is not available. Use a polyfill or update your runtime.',
    );
  },
};

/**
 * Generate a random hex string of specified byte length
 */
export function randomHex(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  safeCrypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a string using SHA-256
 */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await safeCrypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA-512
 */
export async function sha512(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await safeCrypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

