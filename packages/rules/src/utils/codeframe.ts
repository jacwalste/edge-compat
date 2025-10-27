import type { CodeFrame, SourceLocation } from '../types.js';

/**
 * Generate a code frame with context lines
 */
export function generateCodeFrame(
  fileContent: string,
  location: SourceLocation,
  contextLines = 3,
): CodeFrame {
  const lines = fileContent.split('\n');
  const startLine = Math.max(0, location.line - contextLines - 1);
  const endLine = Math.min(
    lines.length - 1,
    (location.endLine ?? location.line) + contextLines - 1,
  );

  const relevantLines = lines.slice(startLine, endLine + 1);
  const lineNumberWidth = String(endLine + 1).length;

  const framedLines = relevantLines.map((line, idx) => {
    const lineNumber = startLine + idx + 1;
    const isTargetLine =
      lineNumber >= location.line &&
      lineNumber <= (location.endLine ?? location.line);
    const marker = isTargetLine ? '>' : ' ';
    const paddedLineNumber = String(lineNumber).padStart(lineNumberWidth, ' ');
    return `${marker} ${paddedLineNumber} | ${line}`;
  });

  return {
    code: framedLines.join('\n'),
    location,
  };
}

/**
 * Find the line and column for a given position in source text
 */
export function getLocationFromPosition(
  source: string,
  position: number,
): { line: number; column: number } {
  const lines = source.slice(0, position).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1]?.length ?? 0,
  };
}

