import { stats } from '../lib.mjs';

const SEEDS = [1000, 2000, 3000, 4000, 5000];

export const title = 'Навчання: епохи, швидкість навчання, розмір набору';

const aggregate = (items, keys) => {
  const out = {};
  for (const key of keys) {
    const s = stats(items.map((i) => i[key]));
    out[key] = s.mean;
    out[`${key}Std`] = s.std;
    out[`${key}Min`] = s.min;
    out[`${key}Max`] = s.max;
  }
  return out;
};

const KEYS = ['accuracy', 'hardAccuracy', 'error', 'epochs', 'trainMs', 'f1'];

const trainOnce = async (page, samplesKey, cfg, epochs, lr) =>
  page.evaluate(async ({ samplesKey, cfg, epochs, lr }) => {
    const b = window.__b;
    const { r } = await b.train(window.__ds[samplesKey], cfg, epochs, lr);
    const model = b.toModel(r);
    const hardAccuracy = await b.hardAccuracy(model);
    return { ...b.metrics(r), hardAccuracy };
  }, { samplesKey, cfg, epochs, lr });

export default async function run(page) {
  await page.evaluate(() => window.__b.hardSet());
  await page.evaluate(() => { window.__ds = {}; });
  for (const seed of SEEDS) {
    await page.evaluate(async (seed) => { window.__ds[seed] = (await window.__b.prep({}, seed)).samples; }, seed);
  }

  const epochRows = [];
  for (const epochs of [10, 25, 50, 100, 250, 500, 1000, 2000]) {
    const items = [];
    for (const seed of SEEDS) items.push(await trainOnce(page, seed, {}, epochs, 0.3));
    epochRows.push({ epochsSetting: epochs, runs: items.length, ...aggregate(items, KEYS) });
    const last = epochRows.at(-1);
    console.log(`  епох ${epochs}: точність ${(last.accuracy * 100).toFixed(1)}%, складний тест ${(last.hardAccuracy * 100).toFixed(1)}%, помилка ${last.error.toFixed(4)}, ${last.trainMs.toFixed(0)} мс`);
  }

  const lrRows = [];
  for (const lr of [0.01, 0.05, 0.1, 0.3, 0.5, 0.8, 0.95]) {
    const items = [];
    for (const seed of SEEDS) items.push(await trainOnce(page, seed, {}, 2000, lr));
    lrRows.push({ learningRate: lr, runs: items.length, ...aggregate(items, KEYS) });
    const last = lrRows.at(-1);
    console.log(`  швидкість ${lr}: точність ${(last.accuracy * 100).toFixed(1)}%, епох ${last.epochs.toFixed(0)}, помилка ${last.error.toFixed(4)}`);
  }

  const shortRows = [];
  for (const epochs of [25, 100, 500]) {
    for (const lr of [0.05, 0.3, 0.95]) {
      const items = [];
      for (const seed of SEEDS) items.push(await trainOnce(page, seed, {}, epochs, lr));
      shortRows.push({ epochsSetting: epochs, learningRate: lr, runs: items.length, ...aggregate(items, KEYS) });
    }
  }

  const sizeRows = [];
  for (const perGroup of [2, 5, 10, 25, 50, 100, 300]) {
    const items = [];
    for (const seed of SEEDS) {
      await page.evaluate(async ({ perGroup, seed }) => { window.__ds.tmp = (await window.__b.prep({ imagesPerGroup: perGroup }, seed)).samples; }, { perGroup, seed });
      items.push(await trainOnce(page, 'tmp', { imagesPerGroup: perGroup }, 2000, 0.3));
    }
    sizeRows.push({ imagesPerGroup: perGroup, images: perGroup * 3, runs: items.length, ...aggregate(items, KEYS) });
    const last = sizeRows.at(-1);
    console.log(`  ${perGroup * 3} зображень: точність ${(last.accuracy * 100).toFixed(1)}%, складний тест ${(last.hardAccuracy * 100).toFixed(1)}%`);
  }

  return { tables: { 'training-epochs': epochRows, 'training-lr': lrRows, 'training-epochs-lr': shortRows, 'training-size': sizeRows } };
}
