import type { Finding } from '@edge-compat/rules';

export interface ReporterOptions {
  cwd: string;
  outputFile?: string;
}

export interface ScanResult {
  findings: Finding[];
  fileCount: number;
  duration: number;
}

export interface Reporter {
  report(result: ScanResult, options: ReporterOptions): Promise<void> | void;
}

