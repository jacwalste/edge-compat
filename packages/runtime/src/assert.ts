import { isEdge } from './detect.js';

/**
 * Context types for edge assertions
 */
export type EdgeContext = 'middleware' | 'function' | 'api-route' | 'general';

/**
 * Error thrown when Edge safety check fails
 */
export class EdgeCompatibilityError extends Error {
  constructor(message: string, public context?: EdgeContext) {
    super(message);
    this.name = 'EdgeCompatibilityError';
  }
}

/**
 * Assert that we are running in an Edge-safe environment
 * Throws if Node.js-only APIs are detected
 */
export function assertEdgeSafe(context?: EdgeContext): void {
  const issues: string[] = [];

  // Check for Node.js core modules that shouldn't be available in Edge
  if (typeof process !== 'undefined') {
    // @ts-expect-error - checking for node-specific API
    if (typeof process.binding === 'function') {
      issues.push('Node.js process.binding detected');
    }
  }

  // Check for fs module
  try {
    // @ts-expect-error - dynamically checking for fs
    if (typeof require !== 'undefined' && require('fs')) {
      issues.push('Node.js fs module is available');
    }
  } catch {
    // fs not available, which is good for Edge
  }

  if (issues.length > 0) {
    const contextMsg = context ? ` in ${context}` : '';
    throw new EdgeCompatibilityError(
      `Edge runtime compatibility check failed${contextMsg}:\n${issues.map((i) => `  - ${i}`).join('\n')}\n\nThis code appears to be running in a Node.js environment with APIs that are not available in Edge runtimes.`,
      context,
    );
  }
}

/**
 * Assert that a specific API is available
 */
export function assertAPI(apiName: string, checkFn: () => boolean): void {
  if (!checkFn()) {
    throw new EdgeCompatibilityError(
      `Required API "${apiName}" is not available in this environment.`,
    );
  }
}

/**
 * Assert Web Crypto API is available
 */
export function assertWebCrypto(): void {
  assertAPI('crypto.subtle', () => {
    return (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.subtle !== 'undefined'
    );
  });
}

/**
 * Warn about potential Edge compatibility issues (non-throwing)
 */
export function warnEdgeCompat(message: string, context?: EdgeContext): void {
  const contextMsg = context ? ` [${context}]` : '';
  console.warn(`⚠️  Edge Compatibility Warning${contextMsg}: ${message}`);
}

