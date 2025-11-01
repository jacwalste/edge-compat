/**
 * Progress callback for scanning
 */
export interface ScanProgress {
  current: number;
  total: number;
  message?: string;
}

export type ScanProgressCallback = (progress: ScanProgress) => void;

