import { MAX_WORKERS } from '@/shared/config/ml.js';
import { prepareSample } from '@/shared/lib/ml/pipeline.js';

const CHUNK_SIZE = 6;

let pool = [];
let seq = 0;
const pending = new Map();

export const defaultWorkers = () => Math.max(1, Math.min(navigator.hardwareConcurrency || 4, MAX_WORKERS));
export const maxWorkers = () => Math.max(1, navigator.hardwareConcurrency || 4);

function spawn() {
  const worker = new Worker(new URL('./prep.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    const entry = pending.get(data.id);
    if (!entry) return;
    pending.delete(data.id);
    if (data.error) entry.reject(new Error(data.error));
    else entry.resolve(data.results);
  };
  worker.onerror = (event) => {
    pending.forEach((entry, id) => {
      if (entry.worker === worker) {
        pending.delete(id);
        entry.reject(new Error(event.message || 'Помилка воркера підготовки даних'));
      }
    });
  };
  return worker;
}

function call(worker, message) {
  return new Promise((resolve, reject) => {
    seq += 1;
    pending.set(seq, { resolve, reject, worker });
    worker.postMessage({ id: seq, ...message });
  });
}

export async function ensurePool(size) {
  while (pool.length < size) {
    pool.push(spawn());
  }
  await Promise.all(pool.slice(0, size).map((worker) => call(worker, { type: 'ping' })));
}

const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));

function chunked(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function prepareDataset(tasks, { workers, onProgress }) {
  const results = [];
  let done = 0;
  const report = (count) => {
    done += count;
    onProgress?.(done, tasks.length);
  };

  if (workers === 0) {
    for (const part of chunked(tasks, CHUNK_SIZE)) {
      for (const task of part) results.push(await prepareSample(task));
      report(part.length);
      await yieldToUi();
    }
  } else {
    await ensurePool(workers);
    const queue = chunked(tasks, CHUNK_SIZE);
    let next = 0;
    await Promise.all(
      pool.slice(0, workers).map(async (worker) => {
        while (next < queue.length) {
          const part = queue[next];
          next += 1;
          results.push(...(await call(worker, { type: 'prepare', tasks: part })));
          report(part.length);
        }
      }),
    );
  }
  return results.sort((a, b) => a.id - b.id);
}
