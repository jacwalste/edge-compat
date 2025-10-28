import path from 'node:path';
import { stat } from 'node:fs/promises';
import { isAbsolute, resolve, relative } from 'node:path';

/**
 * Maximum file size (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum path length (Windows limit is ~260 chars, we'll be conservative)
 */
const MAX_PATH_LENGTH = 200;

/**
 * Allowed path characters (alphanumeric, spaces, path separators, and common safe chars)
 */
const SAFE_PATH_REGEX = /^[a-zA-Z0-9._\-/\\: \t\n\r]+$/;

/**
 * Validate and sanitize a file path to prevent path traversal attacks
 */
export function validatePath(inputPath: string, baseDir: string = process.cwd()): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  // Check if path is non-empty
  if (!inputPath || inputPath.trim().length === 0) {
    return { valid: false, error: 'Path cannot be empty' };
  }

  // Check path length
  if (inputPath.length > MAX_PATH_LENGTH) {
    return { 
      valid: false, 
      error: `Path exceeds maximum length of ${MAX_PATH_LENGTH} characters` 
    };
  }

  // Check for dangerous characters (strict validation)
  if (!SAFE_PATH_REGEX.test(inputPath)) {
    return { 
      valid: false, 
      error: 'Path contains invalid or dangerous characters' 
    };
  }

  try {
    // Resolve the path to an absolute path
    const resolvedPath = isAbsolute(inputPath) 
      ? resolve(inputPath) 
      : resolve(baseDir, inputPath);

    // Ensure the resolved path is within the base directory
    const relativePath = relative(baseDir, resolvedPath);

    // Check for path traversal attempts (contains .. or starts with /../)
    if (relativePath.startsWith('..') || relativePath.includes('../')) {
      return { 
        valid: false, 
        error: 'Path traversal detected - path must be within the working directory' 
      };
    }

    return { valid: true, sanitized: resolvedPath };
  } catch (error) {
    return { 
      valid: false, 
      error: `Invalid path: ${(error as Error).message}` 
    };
  }
}

/**
 * Check if a file exists and is a regular file (not a directory)
 */
export async function validateFile(path: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const stats = await stat(path);
    
    if (!stats.isFile()) {
      return { valid: false, error: 'Path is not a file' };
    }

    // Check file size
    if (stats.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File size (${stats.size} bytes) exceeds maximum allowed size (${MAX_FILE_SIZE} bytes)` 
      };
    }

    return { valid: true };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return { valid: false, error: 'File not found' };
    }
    return { 
      valid: false, 
      error: `Failed to access file: ${err.message}` 
    };
  }
}

/**
 * Sanitize a directory path
 */
export function sanitizeDirectory(inputPath: string, baseDir: string = process.cwd()): string {
  const validation = validatePath(inputPath, baseDir);
  if (!validation.valid || !validation.sanitized) {
    throw new Error(`Invalid directory path: ${validation.error}`);
  }
  return validation.sanitized;
}

/**
 * Check if a path is within a base directory
 */
export function isWithinDirectory(childPath: string, baseDir: string): boolean {
  try {
    const relativePath = path.relative(baseDir, childPath);
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  } catch {
    return false;
  }
}

/**
 * Normalize path to prevent Windows/Unix inconsistencies
 */
export function normalizePath(inputPath: string): string {
  return path.normalize(inputPath).replace(/\\/g, '/');
}

/**
 * Get file size safely
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Validate edgeTarget value
 */
export function validateEdgeTarget(target: string): boolean {
  const validTargets = ['auto', 'next', 'vercel', 'cloudflare', 'deno'];
  return validTargets.includes(target);
}

/**
 * Validate output format
 */
export function validateOutputFormat(format: string): boolean {
  const validFormats = ['pretty', 'json', 'md'];
  return validFormats.includes(format);
}

