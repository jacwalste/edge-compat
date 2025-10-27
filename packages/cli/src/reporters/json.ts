import { writeFile } from 'node:fs/promises';
import type { Reporter, ReporterOptions, ScanResult } from './types.js';

/**
 * JSON reporter - outputs structured JSON
 */
export class JsonReporter implements Reporter {
  async report(result: ScanResult, options: ReporterOptions): Promise<void> {
    const output = JSON.stringify(result, null, 2);

    if (options.outputFile) {
      await writeFile(options.outputFile, output, 'utf-8');
      console.log(`Report written to ${options.outputFile}`);
    } else {
      console.log(output);
    }
  }
}

