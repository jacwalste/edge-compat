/**
 * Detect if running in an Edge runtime
 * 
 * This is a best-effort detection. For guaranteed behavior,
 * set process.env.EDGE_RUNTIME or pass explicit flag.
 */
export function isEdge(explicitFlag?: boolean): boolean {
  // Explicit override
  if (explicitFlag !== undefined) {
    return explicitFlag;
  }

  // Check environment variable
  if (typeof process !== 'undefined' && process.env?.EDGE_RUNTIME) {
    return true;
  }

  // Check for Edge runtime globals
  if (typeof globalThis !== 'undefined') {
    // @ts-expect-error - checking for edge-specific global
    if (globalThis.EdgeRuntime !== undefined) {
      return true;
    }

    // Vercel Edge Runtime
    // @ts-expect-error - checking for vercel-specific global
    if (globalThis.WebSocketPair !== undefined) {
      return true;
    }

    // Cloudflare Workers
    // @ts-expect-error - checking for cloudflare-specific global
    if (globalThis.caches?.default !== undefined && typeof Response !== 'undefined') {
      return true;
    }

    // Deno Deploy (has Deno global)
    // @ts-expect-error - checking for deno-specific global
    if (globalThis.Deno !== undefined) {
      return true;
    }

    // Check if standard Node APIs are missing
    const hasNodeFS = typeof process !== 'undefined' && 
      // @ts-expect-error - checking for node-specific binding
      typeof process.binding === 'function';
    
    const hasWebAPIs = 
      typeof Request !== 'undefined' &&
      typeof Response !== 'undefined' &&
      typeof fetch !== 'undefined';

    // If has Web APIs but not Node FS, likely Edge
    if (hasWebAPIs && !hasNodeFS) {
      return true;
    }
  }

  return false;
}

/**
 * Get the detected Edge runtime name (best effort)
 */
export function getEdgeRuntime(): string | null {
  if (!isEdge()) {
    return null;
  }

  // @ts-expect-error - checking for specific globals
  if (typeof globalThis !== 'undefined' && globalThis.EdgeRuntime) {
    return 'vercel-edge';
  }

  // @ts-expect-error - checking for cloudflare-specific global
  if (typeof globalThis !== 'undefined' && globalThis.WebSocketPair) {
    return 'cloudflare-workers';
  }

  // @ts-expect-error - checking for deno-specific global
  if (typeof globalThis !== 'undefined' && globalThis.Deno) {
    return 'deno-deploy';
  }

  return 'unknown-edge';
}

