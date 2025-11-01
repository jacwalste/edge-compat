import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * Check if a directory is a git repository
 */
export function isGitRepository(cwd: string): boolean {
  return existsSync(`${cwd}/.git`);
}

/**
 * Get list of changed files from git (compared to HEAD)
 */
export function getChangedFiles(cwd: string, baseRef: string = 'HEAD'): string[] {
  try {
    if (!isGitRepository(cwd)) {
      return [];
    }

    // Get modified and added files
    const output = execSync(
      `git diff --name-only --diff-filter=ACMR ${baseRef} --`,
      { cwd, encoding: 'utf-8', stdio: 'pipe' },
    );

    return output
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((file) => `${cwd}/${file}`.replace(/\/+/g, '/'));
  } catch (error) {
    // Git command failed or not in a git repo
    return [];
  }
}

/**
 * Get list of unstaged files
 */
export function getUnstagedFiles(cwd: string): string[] {
  try {
    if (!isGitRepository(cwd)) {
      return [];
    }

    const output = execSync(
      'git diff --name-only --diff-filter=ACMR --',
      { cwd, encoding: 'utf-8', stdio: 'pipe' },
    );

    return output
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((file) => `${cwd}/${file}`.replace(/\/+/g, '/'));
  } catch (error) {
    return [];
  }
}

/**
 * Get list of staged files
 */
export function getStagedFiles(cwd: string): string[] {
  try {
    if (!isGitRepository(cwd)) {
      return [];
    }

    const output = execSync(
      'git diff --cached --name-only --diff-filter=ACMR --',
      { cwd, encoding: 'utf-8', stdio: 'pipe' },
    );

    return output
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((file) => `${cwd}/${file}`.replace(/\/+/g, '/'));
  } catch (error) {
    return [];
  }
}

/**
 * Get all changed files (staged + unstaged)
 */
export function getAllChangedFiles(cwd: string): string[] {
  const staged = getStagedFiles(cwd);
  const unstaged = getUnstagedFiles(cwd);
  
  // Remove duplicates
  const all = new Set([...staged, ...unstaged]);
  return Array.from(all);
}

