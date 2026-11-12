import { prepareSample } from '@/shared/lib/ml/pipeline.js';

self.onmessage = async ({ data }) => {
  const { id, type, tasks } = data;
  try {
    if (type === 'ping') {
      self.postMessage({ id, results: [] });
      return;
    }
    const results = [];
    for (const task of tasks) results.push(await prepareSample(task));
    self.postMessage({ id, results });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
