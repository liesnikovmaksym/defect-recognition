import { stats } from '../lib.mjs';

const RUNS = 10;

export const title = 'Час розпізнавання залежно від розміру зображення';

export default async function run(page) {
  await page.evaluate(() => window.__b.ensureModel());

  const cold = await page.evaluate(async () => {
    const { ml, makeFile } = window.__t;
    const file = await makeFile({ size: 256, format: 'png', defect: true, seed: 1 });
    const rows = [];
    for (let i = 0; i < 10; i += 1) {
      const t0 = performance.now();
      const r = await ml.recognizeInWorker(file, window.__model, () => {});
      rows.push({ run: i + 1, wallMs: performance.now() - t0, totalMs: r.totalMs, decode: r.steps.decode, histogram: r.steps.histogram, predict: r.steps.predict });
    }
    return rows;
  });

  const cases = [
    ...[400, 580, 1300, 1830].map((s) => ({ group: 'BMP за розміром файлу', width: s, height: s, format: 'bmp', noise: 0 })),
    ...[[640, 480], [1280, 720], [1920, 1080], [3840, 2160]].flatMap(([width, height]) => ['png', 'jpg', 'bmp'].map((format) => ({ group: 'Роздільність і формат', width, height, format, noise: 0 }))),
    ...[[1920, 1080], [3840, 2160]].flatMap(([width, height]) => ['png', 'jpg'].map((format) => ({ group: 'З шумом', width, height, format, noise: 40 }))),
  ];

  const rows = [];
  for (const c of cases) {
    const measured = await page.evaluate(async ({ c, RUNS }) => {
      const { ml, makeFile } = window.__t;
      const file = await makeFile({ width: c.width, height: c.height, format: c.format, defect: true, seed: 5, draw: c.noise ? window.__b.noiseDraw(c.noise) : undefined });
      const runs = [];
      let label = null;
      for (let i = 0; i < RUNS; i += 1) {
        const t0 = performance.now();
        const r = await ml.recognizeInWorker(file, window.__model, () => {});
        runs.push({ wallMs: performance.now() - t0, totalMs: r.totalMs, decode: r.steps.decode, histogram: r.steps.histogram, predict: r.steps.predict });
        label = r.label;
      }
      return { bytes: file.size, runs, label };
    }, { c, RUNS });
    const total = stats(measured.runs.map((r) => r.totalMs));
    const wall = stats(measured.runs.map((r) => r.wallMs));
    const decode = stats(measured.runs.map((r) => r.decode));
    const rest = stats(measured.runs.map((r) => r.histogram + r.predict));
    rows.push({
      group: c.group,
      width: c.width,
      height: c.height,
      pixels: c.width * c.height,
      format: c.format,
      noise: c.noise,
      fileBytes: measured.bytes,
      fileMb: measured.bytes / 1048576,
      label: measured.label,
      totalMin: total.min,
      totalMax: total.max,
      totalMean: total.mean,
      totalMedian: total.median,
      totalStd: total.std,
      wallMedian: wall.median,
      decodeMedian: decode.median,
      restMedian: rest.median,
      runsTotal: measured.runs.map((r) => Number(r.totalMs.toFixed(2))),
    });
    console.log(`  ${c.group} ${c.width}x${c.height} ${c.format}${c.noise ? ' шум' : ''}: ${total.median.toFixed(1)} мс (файл ${(measured.bytes / 1048576).toFixed(2)} МБ)`);
  }

  return { tables: { 'recognition-size': rows, 'recognition-cold': cold } };
}
