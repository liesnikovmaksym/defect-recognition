import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, launchBrowser, setupPage, startApp, stats, writeJson } from './browser.mjs';

export { ROOT, launchBrowser, setupPage, startApp, stats, writeJson };

export const RESULTS = path.join(ROOT, 'bench', 'results');

const BENCH_HELPERS = `
(() => {
  const { ml, tasks, shapes, rng, makeFile } = window.__t;
  const DEFAULT = { groups: ['icons', 'standard', 'hq'], format: 'mixed', imagesPerGroup: 300, variety: 'extended', shapes: ['circle'], bins: 32, singleBias: 0 };
  const TWO_PI = Math.PI * 2;

  const noiseDraw = (sigma, seed = 77) => (ctx, w, h) => {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const rand = rng.createRng(seed);
    for (let i = 0; i < d.length; i += 4) {
      const n = (rand() + rand() + rand() - 1.5) * 2 * sigma;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
  };

  const b = {
    DEFAULT,
    TWO_PI,
    noiseDraw,
    async prep(cfg, seed, workers = 8, extra = {}) {
      const list = tasks.buildTasks({ ...DEFAULT, ...cfg, seed });
      const t0 = performance.now();
      const samples = await ml.prepareDataset(list, { workers, ...extra });
      return { samples, ms: performance.now() - t0 };
    },
    async train(samples, cfg, epochs, lr) {
      const t0 = performance.now();
      const r = await ml.trainInWorker(samples, { ...DEFAULT, ...cfg, epochs, learningRate: lr }, () => {});
      return { r, wallMs: performance.now() - t0 };
    },
    toModel(r) {
      const payload = { netJson: r.netJson, normalizer: r.normalizer };
      return { id: 'm' + Math.random().toString(36).slice(2), getPayload: () => payload };
    },
    metrics(r) {
      const c = r.confusion;
      const tp = c.defect.defect;
      const fn = c.defect.normal;
      const fp = c.normal.defect;
      const tn = c.normal.normal;
      const precision = tp / Math.max(1, tp + fp);
      const recall = tp / Math.max(1, tp + fn);
      return { accuracy: r.accuracy, error: r.trainError, epochs: r.epochs, trainMs: r.trainMs, tp, fn, fp, tn, precision, recall, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0 };
    },
    async ensureModel() {
      if (window.__model) return window.__trained;
      const { samples } = await b.prep({}, 1000);
      const { r } = await b.train(samples, {}, 2000, 0.3);
      window.__model = b.toModel(r);
      window.__trained = b.metrics(r);
      return window.__trained;
    },
    async recognizeLabels(model, files) {
      const labels = [];
      for (const file of files) labels.push((await ml.recognizeInWorker(file, model, () => {})).label);
      return labels;
    },
    specFor(type, defective, seed, extra = {}) {
      const spec = shapes.randomSpec(rng.createRng(seed), { defective, variety: 'extended', shapes: [type], aligned: true });
      return Object.assign(spec, extra);
    },
    circleWithSpike(angle, len, wid) {
      return { ...shapes.nominalSpec('circle'), spikes: [{ kind: 'spike', angle, len, wid }] };
    },
    async hardSet() {
      if (window.__hard) return window.__hard;
      const files = [];
      const truth = [];
      for (let i = 0; i < 60; i += 1) {
        const rand = rng.createRng(880000 + i);
        files.push(await makeFile({ size: 128, format: 'png', spec: { ...shapes.nominalSpec('circle') } }));
        truth.push('normal');
        const angle = rand() * TWO_PI;
        const len = 0.02 + rand() * 0.03;
        const wid = 0.02 + rand() * 0.02;
        files.push(await makeFile({ size: 128, format: 'png', spec: b.circleWithSpike(angle, len, wid) }));
        truth.push('defect');
      }
      window.__hard = { files, truth };
      return window.__hard;
    },
    async hardAccuracy(model) {
      const { files, truth } = await b.hardSet();
      const labels = await b.recognizeLabels(model, files);
      return labels.filter((l, i) => l === truth[i]).length / truth.length;
    },
  };
  window.__b = b;
})()
`;

export const setupBench = async (page, url) => {
  await setupPage(page, url);
  await page.evaluate(BENCH_HELPERS);
};

const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'number' ? String(Number.isInteger(value) ? value : Number(value.toFixed(4))) : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const writeCsv = (file, rows) => {
  if (!rows.length) return;
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r).filter((k) => typeof r[k] !== 'object' || r[k] === null)))];
  const lines = [keys.join(';'), ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(';'))];
  fs.writeFileSync(file, lines.join('\n'));
};

export const saveTables = (tables) => {
  fs.mkdirSync(RESULTS, { recursive: true });
  for (const [name, rows] of Object.entries(tables)) {
    writeJson(path.join(RESULTS, `${name}.json`), rows);
    writeCsv(path.join(RESULTS, `${name}.csv`), rows);
  }
};

export const environment = async (browser, page) => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const version = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', name, 'package.json'), 'utf8')).version;
  const cpus = os.cpus();
  const pageInfo = await page.evaluate(() => ({ hardwareConcurrency: navigator.hardwareConcurrency, userAgent: navigator.userAgent, deviceMemory: navigator.deviceMemory ?? null }));
  return {
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: cpus[0].model.trim(),
    logicalCores: cpus.length,
    ramGb: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10,
    browser: `Microsoft Edge ${browser.version()} (Chromium)`,
    node: process.version,
    hardwareConcurrency: pageInfo.hardwareConcurrency,
    userAgent: pageInfo.userAgent,
    libraries: Object.fromEntries(['react', 'react-dom', '@reduxjs/toolkit', 'brain.js', 'vite', 'playwright-core'].map((n) => [n, version(n)])),
    app: pkg.name,
    date: new Date().toISOString(),
  };
};

export const timed = async (fn, runs) => {
  const values = [];
  for (let i = 0; i < runs; i += 1) values.push(await fn(i));
  return values;
};
