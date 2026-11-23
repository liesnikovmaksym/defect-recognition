import { stats } from '../lib.mjs';

const SEEDS = [1000, 2000, 3000];

export const title = 'Навчання: групи якості, формати файлів, кількість фігур';

const ALL_SHAPES = ['circle', 'ellipse', 'square', 'rectangle', 'triangle', 'hexagon'];

const evaluate = (page, spec) =>
  page.evaluate(async ({ spec }) => {
    const { ml, makeFile } = window.__t;
    const b = window.__b;
    const model = window.__current;
    const results = {};
    for (const test of spec) {
      let correct = 0;
      let total = 0;
      for (let i = 0; i < test.count; i += 1) {
        const defect = i % 2 === 1;
        const seed = 700000 + i * 3 + (test.offset ?? 0);
        const fileSpec = b.specFor(test.shape ?? 'circle', defect, seed);
        const format = test.format ?? ['png', 'jpg', 'bmp'][i % 3];
        const file = await makeFile({ size: test.size ?? 128, format, spec: fileSpec });
        const r = await ml.recognizeInWorker(file, model, () => {});
        total += 1;
        if (r.label === (defect ? 'defect' : 'normal')) correct += 1;
      }
      results[test.key] = correct / total;
    }
    return results;
  }, { spec });

const trainModel = (page, cfg, seed) =>
  page.evaluate(async ({ cfg, seed }) => {
    const b = window.__b;
    const { samples } = await b.prep(cfg, seed);
    const { r } = await b.train(samples, cfg, 2000, 0.3);
    window.__current = b.toModel(r);
    return b.metrics(r);
  }, { cfg, seed });

const mean = (values) => stats(values).mean;

export default async function run(page) {
  const groupRows = [];
  const groupConfigs = [
    ['тільки Іконки 32×32', { groups: ['icons'], imagesPerGroup: 900 }],
    ['тільки Стандартні 128×128', { groups: ['standard'], imagesPerGroup: 900 }],
    ['тільки Якісні 1024×1024', { groups: ['hq'], imagesPerGroup: 900 }],
    ['усі три групи', { groups: ['icons', 'standard', 'hq'], imagesPerGroup: 300 }],
  ];
  for (const [name, cfg] of groupConfigs) {
    const metrics = [];
    const cross = { 32: [], 128: [], 1024: [] };
    for (const seed of SEEDS) {
      metrics.push(await trainModel(page, cfg, seed));
      const res = await evaluate(page, [32, 128, 1024].map((size) => ({ key: String(size), size, count: 40 })));
      for (const size of [32, 128, 1024]) cross[size].push(res[size]);
    }
    groupRows.push({ trainedOn: name, internalAccuracy: mean(metrics.map((m) => m.accuracy)), trainMs: mean(metrics.map((m) => m.trainMs)), testOn32: mean(cross[32]), testOn128: mean(cross[128]), testOn1024: mean(cross[1024]) });
    console.log(`  ${name}: внутрішня ${(groupRows.at(-1).internalAccuracy * 100).toFixed(1)}%, на 32: ${(groupRows.at(-1).testOn32 * 100).toFixed(1)}%, на 128: ${(groupRows.at(-1).testOn128 * 100).toFixed(1)}%, на 1024: ${(groupRows.at(-1).testOn1024 * 100).toFixed(1)}%`);
  }

  const formatRows = [];
  for (const [name, format] of [['тільки PNG', 'png'], ['тільки JPG', 'jpg'], ['тільки BMP', 'bmp'], ['змішані', 'mixed']]) {
    const metrics = [];
    const cross = { png: [], jpg: [], bmp: [] };
    for (const seed of SEEDS) {
      metrics.push(await trainModel(page, { format }, seed));
      const res = await evaluate(page, ['png', 'jpg', 'bmp'].map((f) => ({ key: f, format: f, size: 128, count: 40 })));
      for (const f of ['png', 'jpg', 'bmp']) cross[f].push(res[f]);
    }
    formatRows.push({ trainedOn: name, internalAccuracy: mean(metrics.map((m) => m.accuracy)), testOnPng: mean(cross.png), testOnJpg: mean(cross.jpg), testOnBmp: mean(cross.bmp) });
    console.log(`  ${name}: PNG ${(formatRows.at(-1).testOnPng * 100).toFixed(1)}%, JPG ${(formatRows.at(-1).testOnJpg * 100).toFixed(1)}%, BMP ${(formatRows.at(-1).testOnBmp * 100).toFixed(1)}%`);
  }

  const shapeRows = [];
  const shapeConfigs = [
    ['коло', ['circle']],
    ['коло + квадрат', ['circle', 'square']],
    ['усі 6 фігур', ALL_SHAPES],
    ...ALL_SHAPES.slice(1).map((s) => [`окрема модель: ${s}`, [s]]),
  ];
  for (const [name, shapes] of shapeConfigs) {
    const metrics = [];
    const perShape = Object.fromEntries(ALL_SHAPES.map((s) => [s, []]));
    for (const seed of SEEDS) {
      metrics.push(await trainModel(page, { shapes, imagesPerGroup: 100 }, seed));
      const res = await evaluate(page, ALL_SHAPES.map((s) => ({ key: s, shape: s, format: 'png', size: 128, count: 40 })));
      for (const s of ALL_SHAPES) perShape[s].push(res[s]);
    }
    const row = { configuration: name, shapes: shapes.length, reference: shapes[0], internalAccuracy: mean(metrics.map((m) => m.accuracy)) };
    for (const s of ALL_SHAPES) row[`on_${s}`] = mean(perShape[s]);
    shapeRows.push(row);
    console.log(`  ${name}: внутрішня ${(row.internalAccuracy * 100).toFixed(1)}%, коло ${(row.on_circle * 100).toFixed(1)}%, квадрат ${(row.on_square * 100).toFixed(1)}%, трикутник ${(row.on_triangle * 100).toFixed(1)}%`);
  }

  return { tables: { 'data-groups': groupRows, 'data-formats': formatRows, 'data-shapes': shapeRows } };
}
