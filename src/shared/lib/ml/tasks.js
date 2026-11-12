import { DATASET_GROUPS } from '@/shared/config/ml.js';

export function buildTasks({
  groups,
  format,
  imagesPerGroup,
  variety = 'basic',
  shapes,
  bins = 32,
  singleBias = 0,
  seed = 1000,
}) {
  const tasks = [];
  for (const group of DATASET_GROUPS) {
    if (!groups.includes(group.id)) continue;
    for (let index = 0; index < imagesPerGroup; index += 1) {
      const id = tasks.length;
      tasks.push({ id, index, group, format, variety, shapes, bins, singleBias, seed: seed + id * 7919 });
    }
  }
  return tasks;
}
