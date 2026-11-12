export { prepareDataset, defaultWorkers, maxWorkers } from './pool.js';

let worker = null;
let seq = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./train.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      const entry = pending.get(data.id);
      if (!entry) return;
      if (data.type === 'progress') entry.onProgress?.(data);
      else {
        pending.delete(data.id);
        if (data.type === 'done') entry.resolve(data.result);
        else entry.reject(new Error(data.message));
      }
    };
    worker.onerror = (event) => {
      pending.forEach((entry) => entry.reject(new Error(event.message || 'Помилка воркера')));
      pending.clear();
    };
  }
  return worker;
}

function request(type, payload, onProgress) {
  return new Promise((resolve, reject) => {
    seq += 1;
    pending.set(seq, { resolve, reject, onProgress });
    getWorker().postMessage({ id: seq, type, payload });
  });
}

let loadedModelId = null;

export const markModelLoaded = (id) => {
  loadedModelId = id;
};

export const trainInWorker = (samples, config, onProgress) => {
  loadedModelId = null;
  return request('train', { samples, config }, onProgress);
};

export async function recognizeInWorker(blob, model, onProgress) {
  const payload = { blob };
  if (loadedModelId !== model.id) {
    const stored = model.getPayload();
    if (!stored) throw new Error('Дані моделі не знайдено у сховищі браузера. Навчіть модель заново.');
    payload.model = stored;
  }
  const result = await request('recognize', payload, onProgress);
  loadedModelId = model.id;
  return result;
}
