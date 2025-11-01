import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'pathe';

const WORKER_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'worker-scanner.js',
);

export interface WorkerScanTask {
  filePath: string;
  fileContent: string;
  rules: string[]; // Rule IDs to run
  config: {
    edgeTarget: string;
    strict: boolean;
  };
}

export interface WorkerScanResult {
  filePath: string;
  findings: any[];
  error?: string;
}

/**
 * Scan a file in a worker thread
 */
export async function scanFileInWorker(
  task: WorkerScanTask,
): Promise<WorkerScanResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_FILE, {
      workerData: task,
    });

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error(`Worker timeout for ${task.filePath}`));
    }, 30000); // 30 second timeout

    worker.on('message', (result: WorkerScanResult) => {
      clearTimeout(timeout);
      worker.terminate();
      resolve(result);
    });

    worker.on('error', (error) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(error);
    });

    worker.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

/**
 * Scan multiple files in parallel using worker threads
 */
export async function scanFilesInParallel(
  tasks: WorkerScanTask[],
  maxWorkers: number = Math.min(4, tasks.length),
): Promise<WorkerScanResult[]> {
  const results: WorkerScanResult[] = [];
  const queue = [...tasks];
  let activeWorkers = 0;
  
  return new Promise((resolve, reject) => {
    const processNext = async () => {
      while (queue.length > 0 && activeWorkers < maxWorkers) {
        const task = queue.shift();
        if (!task) break;

        activeWorkers++;
        
        scanFileInWorker(task)
          .then((result) => {
            results.push(result);
            activeWorkers--;
            if (queue.length === 0 && activeWorkers === 0) {
              resolve(results);
            } else {
              processNext();
            }
          })
          .catch((error) => {
            results.push({
              filePath: task.filePath,
              findings: [],
              error: error.message,
            });
            activeWorkers--;
            if (queue.length === 0 && activeWorkers === 0) {
              resolve(results);
            } else {
              processNext();
            }
          });
      }
    };

    if (tasks.length === 0) {
      resolve([]);
      return;
    }

    processNext();
  });
}

