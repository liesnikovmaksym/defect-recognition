import { stats } from '../lib.mjs';

export const title = 'Чутливість інтерфейсу під час обчислень';

const RUNS = 3;

const measure = (page, scenario) =>
  page.evaluate(async ({ scenario }) => {
    const b = window.__b;
    const gaps = [];
    let last = performance.now();
    let running = true;
    const tick = () => {
      const now = performance.now();
      gaps.push(now - last);
      last = now;
      if (running) requestAnimationFrame(tick);
    };
    const longTasks = [];
    const observer = new PerformanceObserver((list) => list.getEntries().forEach((e) => longTasks.push(e.duration)));
    observer.observe({ entryTypes: ['longtask'] });
    requestAnimationFrame(tick);
    await new Promise((r) => setTimeout(r, 100));
    const t0 = performance.now();
    if (scenario.kind === 'prep') await b.prep({}, 1000, scenario.workers);
    else {
      const { samples } = await b.prep({ imagesPerGroup: 100 }, 1000, 8);
      gaps.length = 0;
      last = performance.now();
      const t1 = performance.now();
      await b.train(samples, { imagesPerGroup: 100 }, 2000, 0.3);
      scenario.trainMs = performance.now() - t1;
    }
    const totalMs = performance.now() - t0;
    running = false;
    await new Promise((r) => setTimeout(r, 120));
    observer.disconnect();
    const sorted = [...gaps].sort((x, y) => x - y);
    return {
      totalMs,
      frames: gaps.length,
      maxGap: Math.max(...gaps),
      p95Gap: sorted[Math.floor(sorted.length * 0.95)],
      longTasks: longTasks.length,
      longTaskMs: longTasks.reduce((s, v) => s + v, 0),
      longestTask: longTasks.length ? Math.max(...longTasks) : 0,
      windowMs: scenario.kind === 'train' ? scenario.trainMs : totalMs,
    };
  }, { scenario });

export default async function run(page) {
  const scenarios = [
    { name: 'підготовка: пул із 8 воркерів', kind: 'prep', workers: 8 },
    { name: 'підготовка: головний потік', kind: 'prep', workers: 0 },
    { name: 'навчання у воркері мережі', kind: 'train' },
  ];
  const rows = [];
  for (const scenario of scenarios) {
    await page.evaluate(({ workers }) => window.__b.prep({ imagesPerGroup: 4 }, 1, workers ?? 8), { workers: scenario.workers });
    const items = [];
    for (let i = 0; i < RUNS; i += 1) items.push(await measure(page, { ...scenario }));
    const row = { scenario: scenario.name, runs: RUNS };
    for (const key of ['totalMs', 'frames', 'maxGap', 'p95Gap', 'longTasks', 'longTaskMs', 'longestTask', 'windowMs']) row[key] = stats(items.map((i) => i[key])).median;
    row.fps = (row.frames / row.windowMs) * 1000;
    rows.push(row);
    console.log(`  ${scenario.name}: найбільша пауза кадрів ${row.maxGap.toFixed(0)} мс, довгих задач ${row.longTasks}, FPS ${row.fps.toFixed(0)}`);
  }
  return { tables: { responsiveness: rows } };
}
