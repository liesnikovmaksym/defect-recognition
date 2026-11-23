import { stats } from '../lib.mjs';

const RUNS = 5;

export const title = 'Розпаралелення підготовки даних';

const measure = async (page, cfg, workers, extra = {}) => {
  await page.evaluate(({ workers }) => window.__b.prep({ imagesPerGroup: 4 }, 1, workers), { workers });
  const times = [];
  for (let i = 0; i < RUNS; i += 1) {
    times.push(await page.evaluate(async ({ cfg, workers, extra }) => (await window.__b.prep(cfg, 1000, workers, extra)).ms, { cfg, workers, extra }));
  }
  return times;
};

export default async function run(page) {
  const workerCounts = [0, 1, 2, 4, 6, 8, 12];
  const workersRows = [];
  for (const workers of workerCounts) {
    const times = await measure(page, {}, workers);
    const s = stats(times);
    workersRows.push({ workers, images: 900, min: s.min, max: s.max, mean: s.mean, median: s.median, std: s.std, runs: times.map((t) => Number(t.toFixed(1))) });
    console.log(`  воркерів ${workers}: ${s.median.toFixed(0)} мс`);
  }
  const base = workersRows.find((r) => r.workers === 0).median;
  const one = workersRows.find((r) => r.workers === 1).median;
  for (const row of workersRows) {
    row.speedupVsMain = base / row.median;
    row.speedupVsOne = one / row.median;
    row.efficiency = row.workers ? row.speedupVsOne / row.workers : null;
  }

  const chunkSizes = [1, 2, 3, 6, 12, 30, 112];
  const chunkRows = [];
  for (const chunkSize of chunkSizes) {
    const times = await measure(page, {}, 8, { chunkSize });
    const s = stats(times);
    chunkRows.push({ chunkSize, chunks: Math.ceil(900 / chunkSize), min: s.min, max: s.max, mean: s.mean, median: s.median, std: s.std, runs: times.map((t) => Number(t.toFixed(1))) });
    console.log(`  порція ${chunkSize}: ${s.median.toFixed(0)} мс`);
  }

  const scaleRows = [];
  for (const perGroup of [10, 50, 100, 300, 600]) {
    for (const workers of [0, 8]) {
      const times = await measure(page, { imagesPerGroup: perGroup }, workers);
      const s = stats(times);
      scaleRows.push({ images: perGroup * 3, workers, min: s.min, max: s.max, mean: s.mean, median: s.median, std: s.std, perImageMs: s.median / (perGroup * 3), runs: times.map((t) => Number(t.toFixed(1))) });
      console.log(`  ${perGroup * 3} зображень, воркерів ${workers}: ${s.median.toFixed(0)} мс`);
    }
  }

  return { tables: { 'parallel-workers': workersRows, 'parallel-chunk': chunkRows, 'parallel-scale': scaleRows } };
}
