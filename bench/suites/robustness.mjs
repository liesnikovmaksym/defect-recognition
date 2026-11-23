export const title = 'Стійкість моделі до змін зображення';

const run1 = (page, fn, arg) => page.evaluate(fn, arg);

export default async function run(page) {
  const trained = await page.evaluate(() => window.__b.ensureModel());
  console.log(`  базова модель: точність ${(trained.accuracy * 100).toFixed(1)}%`);

  const spikeRows = await run1(page, async () => {
    const { ml, makeFile } = window.__t;
    const b = window.__b;
    const rows = [];
    for (const wid of [0.03, 0.05]) {
      for (const len of [0.005, 0.01, 0.015, 0.02, 0.03, 0.04, 0.06, 0.08, 0.12]) {
        let hits = 0;
        const n = 60;
        for (let i = 0; i < n; i += 1) {
          const angle = ((i * 137.508) % 360) * (Math.PI / 180);
          const file = await makeFile({ size: 256, format: 'png', spec: b.circleWithSpike(angle, len, wid) });
          if ((await ml.recognizeInWorker(file, window.__model, () => {})).label === 'defect') hits += 1;
        }
        const areaPercent = ((len * wid) / (Math.PI * 0.3 * 0.3)) * 100;
        rows.push({ spikeLength: len, spikeWidth: wid, areaPercent, n, detected: hits / n });
      }
    }
    return rows;
  });
  for (const r of spikeRows.filter((r) => r.spikeWidth === 0.05)) console.log(`  виступ ${r.spikeLength} x ${r.spikeWidth} (${r.areaPercent.toFixed(2)}% площі): виявлено ${(r.detected * 100).toFixed(0)}%`);

  const sizeRows = await run1(page, async () => {
    const { ml, makeFile } = window.__t;
    const b = window.__b;
    const rows = [];
    for (const size of [16, 32, 64, 128, 256, 1024]) {
      for (const format of ['png', 'jpg', 'bmp']) {
        const n = 40;
        let fp = 0;
        let tp = 0;
        for (let i = 0; i < n; i += 1) {
          const normal = await makeFile({ size, format, spec: b.specFor('circle', false, 600000 + i) });
          const defect = await makeFile({ size, format, spec: b.specFor('circle', true, 610000 + i) });
          if ((await ml.recognizeInWorker(normal, window.__model, () => {})).label === 'defect') fp += 1;
          if ((await ml.recognizeInWorker(defect, window.__model, () => {})).label === 'defect') tp += 1;
        }
        rows.push({ size, format, n, falsePositive: fp / n, detected: tp / n });
      }
    }
    return rows;
  });

  const jpgRows = await run1(page, async () => {
    const { ml, makeFile } = window.__t;
    const b = window.__b;
    const rows = [];
    for (const quality of [0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1]) {
      const n = 60;
      let fp = 0;
      let tp = 0;
      let bytes = 0;
      for (let i = 0; i < n; i += 1) {
        const normal = await makeFile({ size: 256, format: 'jpg', quality, spec: b.specFor('circle', false, 620000 + i) });
        const defect = await makeFile({ size: 256, format: 'jpg', quality, spec: b.specFor('circle', true, 630000 + i) });
        bytes += normal.size;
        if ((await ml.recognizeInWorker(normal, window.__model, () => {})).label === 'defect') fp += 1;
        if ((await ml.recognizeInWorker(defect, window.__model, () => {})).label === 'defect') tp += 1;
      }
      rows.push({ jpgQuality: quality, n, avgBytes: bytes / n, falsePositive: fp / n, detected: tp / n });
    }
    return rows;
  });

  const shiftRows = await run1(page, async () => {
    const { ml, makeFile, shapes } = window.__t;
    const rows = [];
    for (const shift of [0, 0.005, 0.01, 0.02, 0.03, 0.05, 0.08, 0.12, 0.2]) {
      const n = 40;
      let fp = 0;
      for (let i = 0; i < n; i += 1) {
        const angle = ((i * 137.508) % 360) * (Math.PI / 180);
        const spec = { ...shapes.nominalSpec('circle'), cx: 0.5 + shift * Math.cos(angle), cy: 0.5 + shift * Math.sin(angle) };
        const file = await makeFile({ size: 256, format: 'png', spec });
        if ((await ml.recognizeInWorker(file, window.__model, () => {})).label === 'defect') fp += 1;
      }
      rows.push({ shift, n, falsePositive: fp / n });
    }
    return rows;
  });

  const scaleRows = await run1(page, async () => {
    const { ml, makeFile, shapes } = window.__t;
    const rows = [];
    for (const factor of [0.8, 0.9, 0.95, 0.98, 1, 1.02, 1.05, 1.1, 1.2]) {
      const spec = { ...shapes.nominalSpec('circle'), r: 0.3 * factor };
      const file = await makeFile({ size: 256, format: 'png', spec });
      const r = await ml.recognizeInWorker(file, window.__model, () => {});
      rows.push({ radiusFactor: factor, label: r.label, defectScore: r.scores.defect });
    }
    return rows;
  });

  const noiseRows = await run1(page, async () => {
    const { ml, makeFile } = window.__t;
    const b = window.__b;
    const rows = [];
    for (const sigma of [0, 2, 5, 10, 20, 40, 80]) {
      const n = 40;
      let fp = 0;
      let tp = 0;
      for (let i = 0; i < n; i += 1) {
        const normal = await makeFile({ size: 256, format: 'png', spec: b.specFor('circle', false, 640000 + i), draw: sigma ? b.noiseDraw(sigma, 100 + i) : undefined });
        const defect = await makeFile({ size: 256, format: 'png', spec: b.specFor('circle', true, 650000 + i), draw: sigma ? b.noiseDraw(sigma, 200 + i) : undefined });
        if ((await ml.recognizeInWorker(normal, window.__model, () => {})).label === 'defect') fp += 1;
        if ((await ml.recognizeInWorker(defect, window.__model, () => {})).label === 'defect') tp += 1;
      }
      rows.push({ noiseSigma: sigma, n, falsePositive: fp / n, detected: tp / n });
    }
    return rows;
  });

  const gapRows = await run1(page, async () => {
    const { ml, makeFile } = window.__t;
    const S = 256;
    const cases = {
      'круг без дефектів': () => {},
      'виступ': (ctx) => { ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(0.6); ctx.fillStyle = '#fff'; ctx.fillRect(0.3 * S - 6, -7, 0.12 * S, 14); ctx.restore(); },
      'дірка в центрі, радіус 2%': (ctx) => { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(S / 2, S / 2, 0.02 * S, 0, Math.PI * 2); ctx.fill(); },
      'дірка в центрі, радіус 5%': (ctx) => { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(S / 2, S / 2, 0.05 * S, 0, Math.PI * 2); ctx.fill(); },
      'дірка в центрі, радіус 10%': (ctx) => { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(S / 2, S / 2, 0.1 * S, 0, Math.PI * 2); ctx.fill(); },
      'виїмка на краю, радіус 8%': (ctx) => { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(S / 2 + 0.3 * S, S / 2, 0.08 * S, 0, Math.PI * 2); ctx.fill(); },
      'смуга-прогалина 4% завширшки': (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(S / 2 - 0.02 * S, S / 2 - 0.3 * S, 0.04 * S, 0.3 * S); },
    };
    const rows = [];
    for (const [name, draw] of Object.entries(cases)) {
      const file = await makeFile({ size: S, format: 'png', defect: false, spec: window.__t.shapes.nominalSpec('circle'), draw });
      const r = await ml.recognizeInWorker(file, window.__model, () => {});
      rows.push({ case: name, label: r.label, defectScore: r.scores.defect });
    }
    return rows;
  });

  const shapeRows = await run1(page, async () => {
    const { ml, makeFile } = window.__t;
    const b = window.__b;
    const rows = [];
    for (const type of ['circle', 'ellipse', 'square', 'rectangle', 'triangle', 'hexagon']) {
      const n = 40;
      let fp = 0;
      for (let i = 0; i < n; i += 1) {
        const file = await makeFile({ size: 256, format: 'png', spec: b.specFor(type, false, 660000 + i) });
        if ((await ml.recognizeInWorker(file, window.__model, () => {})).label === 'defect') fp += 1;
      }
      rows.push({ shape: type, n, falsePositive: fp / n });
    }
    return rows;
  });

  return { tables: { 'robust-spike': spikeRows, 'robust-size': sizeRows, 'robust-jpg': jpgRows, 'robust-shift': shiftRows, 'robust-scale': scaleRows, 'robust-noise': noiseRows, 'robust-gaps': gapRows, 'robust-shapes': shapeRows } };
}
