export * from './types.js';
export * from './pretty.js';
export * from './json.js';
export * from './markdown.js';

import { PrettyReporter } from './pretty.js';
import { JsonReporter } from './json.js';
import { MarkdownReporter } from './markdown.js';
import type { Reporter } from './types.js';

export type ReporterFormat = 'pretty' | 'json' | 'md';

export function getReporter(format: ReporterFormat): Reporter {
  switch (format) {
    case 'json':
      return new JsonReporter();
    case 'md':
      return new MarkdownReporter();
    case 'pretty':
    default:
      return new PrettyReporter();
  }
}

