import fs from 'node:fs';
import path from 'node:path';
import { RESULTS, launchBrowser } from './lib.mjs';

const COLORS = ['#1f4e9c', '#c0392b', '#1e8449', '#b9770e', '#6c3483', '#566573'];
const DASH = ['', '8 4', '3 3', '10 3 2 3', '', '8 4'];
const W = 900;
const H = 520;
const M = { left: 90, right: 30, top: 50, bottom: 80 };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmtTick = (v) => (Math.abs(v) >= 1000 ? String(Math.round(v)) : Number.isInteger(v) ? String(v) : String(Number(v.toFixed(3))));

const niceTicks = (min, max, count = 6) => {
  const span = max - min || 1;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw);
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + step * 1e-6; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
};

const marker = (shape, x, y, color, filled = true) => {
  const fill = filled ? color : '#fff';
  if (shape === 1) return `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="${fill}" stroke="${color}" stroke-width="2"/>`;
  if (shape === 2) return `<polygon points="${x},${y - 6} ${x + 6},${y + 5} ${x - 6},${y + 5}" fill="${fill}" stroke="${color}" stroke-width="2"/>`;
  if (shape === 3) return `<polygon points="${x},${y - 6} ${x + 6},${y} ${x},${y + 6} ${x - 6},${y}" fill="${fill}" stroke="${color}" stroke-width="2"/>`;
  return `<circle cx="${x}" cy="${y}" r="5" fill="${fill}" stroke="${color}" stroke-width="2"/>`;
};

export function lineChart({ title, xLabel, yLabel, series, xLog = false, yMin, yMax, xTicks, yFormat, xFormat, legendPos }) {
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p.x);
  const xMin = xLog ? Math.min(...xs) : Math.min(0, ...xs);
  const xMax = Math.max(...xs);
  const ys = all.flatMap((p) => [p.y, p.lo ?? p.y, p.hi ?? p.y]);
  const y0 = yMin ?? Math.min(0, ...ys);
  const y1 = yMax ?? Math.max(...ys) * 1.08;
  const px = (v) => {
    if (xLog) return M.left + ((Math.log10(v) - Math.log10(xMin)) / (Math.log10(xMax) - Math.log10(xMin))) * (W - M.left - M.right);
    return M.left + ((v - xMin) / (xMax - xMin || 1)) * (W - M.left - M.right);
  };
  const py = (v) => H - M.bottom - ((v - y0) / (y1 - y0 || 1)) * (H - M.top - M.bottom);
  const yt = niceTicks(y0, y1);
  const xt = xTicks ?? (xLog ? [...new Set(xs)] : niceTicks(xMin, xMax));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Times New Roman, serif"><rect width="${W}" height="${H}" fill="#fff"/>`;
  svg += `<text x="${W / 2}" y="28" text-anchor="middle" font-size="20" font-weight="bold">${esc(title)}</text>`;
  for (const v of yt) svg += `<line x1="${M.left}" x2="${W - M.right}" y1="${py(v)}" y2="${py(v)}" stroke="#d5d8dc"/><text x="${M.left - 10}" y="${py(v) + 5}" text-anchor="end" font-size="15">${esc((yFormat ?? fmtTick)(v))}</text>`;
  for (const v of xt) svg += `<line x1="${px(v)}" x2="${px(v)}" y1="${M.top}" y2="${H - M.bottom}" stroke="#eaecee"/><text x="${px(v)}" y="${H - M.bottom + 22}" text-anchor="middle" font-size="15">${esc((xFormat ?? fmtTick)(v))}</text>`;
  svg += `<line x1="${M.left}" x2="${W - M.right}" y1="${H - M.bottom}" y2="${H - M.bottom}" stroke="#000" stroke-width="1.5"/><line x1="${M.left}" x2="${M.left}" y1="${M.top}" y2="${H - M.bottom}" stroke="#000" stroke-width="1.5"/>`;
  svg += `<text x="${(M.left + W - M.right) / 2}" y="${H - 36}" text-anchor="middle" font-size="17">${esc(xLabel)}</text>`;
  svg += `<text transform="translate(24 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle" font-size="17">${esc(yLabel)}</text>`;
  series.forEach((s, i) => {
    const color = s.color ?? COLORS[i % COLORS.length];
    const pts = s.points.map((p) => `${px(p.x)},${py(p.y)}`).join(' ');
    svg += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" ${s.dash ?? DASH[i] ? `stroke-dasharray="${s.dash ?? DASH[i]}"` : ''}/>`;
    for (const p of s.points) {
      if (p.lo !== undefined && p.hi !== undefined) svg += `<line x1="${px(p.x)}" x2="${px(p.x)}" y1="${py(p.lo)}" y2="${py(p.hi)}" stroke="${color}" stroke-width="1.5"/><line x1="${px(p.x) - 4}" x2="${px(p.x) + 4}" y1="${py(p.lo)}" y2="${py(p.lo)}" stroke="${color}"/><line x1="${px(p.x) - 4}" x2="${px(p.x) + 4}" y1="${py(p.hi)}" y2="${py(p.hi)}" stroke="${color}"/>`;
      svg += marker(s.marker ?? i, px(p.x), py(p.y), color, s.filled ?? true);
    }
  });
  const longest = Math.max(...series.map((s) => s.name.length));
  const legendX = legendPos ? W - M.right - longest * 8.2 - 70 : M.left + 12;
  const legendY0 = legendPos === 'br' ? H - M.bottom - 12 - (series.length - 1) * 22 : legendPos === 'mr' ? (M.top + H - M.bottom) / 2 : M.top + 18;
  series.forEach((s, i) => {
    const color = s.color ?? COLORS[i % COLORS.length];
    const y = legendY0 + i * 22;
    svg += `<rect x="${legendX - 6}" y="${y - 16}" width="${s.name.length * 8.2 + 52}" height="22" fill="#fff" opacity="0.85"/><line x1="${legendX}" x2="${legendX + 30}" y1="${y - 5}" y2="${y - 5}" stroke="${color}" stroke-width="2.5" ${s.dash ?? DASH[i] ? `stroke-dasharray="${s.dash ?? DASH[i]}"` : ''}/>${marker(s.marker ?? i, legendX + 15, y - 5, color, s.filled ?? true)}<text x="${legendX + 40}" y="${y}" font-size="15">${esc(s.name)}</text>`;
  });
  return `${svg}</svg>`;
}

export function barChart({ title, yLabel, categories, series, yMin = 0, yMax, yFormat, valueFormat }) {
  const ys = series.flatMap((s) => s.values);
  const y1 = yMax ?? Math.max(...ys) * 1.15;
  const py = (v) => H - M.bottom - ((v - yMin) / (y1 - yMin || 1)) * (H - M.top - M.bottom);
  const yt = niceTicks(yMin, y1);
  const groupW = (W - M.left - M.right) / categories.length;
  const barW = Math.min(70, (groupW * 0.8) / series.length);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Times New Roman, serif"><rect width="${W}" height="${H}" fill="#fff"/>`;
  svg += `<text x="${W / 2}" y="28" text-anchor="middle" font-size="20" font-weight="bold">${esc(title)}</text>`;
  for (const v of yt) svg += `<line x1="${M.left}" x2="${W - M.right}" y1="${py(v)}" y2="${py(v)}" stroke="#d5d8dc"/><text x="${M.left - 10}" y="${py(v) + 5}" text-anchor="end" font-size="15">${esc((yFormat ?? fmtTick)(v))}</text>`;
  svg += `<line x1="${M.left}" x2="${W - M.right}" y1="${H - M.bottom}" y2="${H - M.bottom}" stroke="#000" stroke-width="1.5"/><line x1="${M.left}" x2="${M.left}" y1="${M.top}" y2="${H - M.bottom}" stroke="#000" stroke-width="1.5"/>`;
  svg += `<text transform="translate(24 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle" font-size="17">${esc(yLabel)}</text>`;
  categories.forEach((c, ci) => {
    const gx = M.left + ci * groupW + groupW / 2;
    svg += `<text x="${gx}" y="${H - M.bottom + 24}" text-anchor="middle" font-size="15">${esc(c)}</text>`;
    series.forEach((s, si) => {
      const x = gx - (series.length * barW) / 2 + si * barW;
      const v = s.values[ci];
      const color = s.color ?? COLORS[si % COLORS.length];
      svg += `<rect x="${x + 2}" y="${py(v)}" width="${barW - 4}" height="${Math.max(0, py(yMin) - py(v))}" fill="${color}"/><text x="${x + barW / 2}" y="${py(v) - 6}" text-anchor="middle" font-size="14">${esc((valueFormat ?? fmtTick)(v))}</text>`;
    });
  });
  series.forEach((s, i) => {
    const color = s.color ?? COLORS[i % COLORS.length];
    const y = M.top + 18 + i * 22;
    svg += `<rect x="${M.left + 8}" y="${y - 14}" width="16" height="14" fill="${color}"/><text x="${M.left + 32}" y="${y - 2}" font-size="15">${esc(s.name)}</text>`;
  });
  return `${svg}</svg>`;
}

const read = (name) => JSON.parse(fs.readFileSync(path.join(RESULTS, `${name}.json`), 'utf8'));
const has = (name) => fs.existsSync(path.join(RESULTS, `${name}.json`));

export function buildCharts() {
  const charts = {};
  const pct = (v) => `${Math.round(v * 100)}%`;

  if (has('recognition-size')) {
    const rows = read('recognition-size');
    const res = rows.filter((r) => r.group === 'Роздільність і формат');
    const noise = rows.filter((r) => r.group === 'З шумом');
    const mk = (format, list) => list.filter((r) => r.format === format).sort((a, b) => a.pixels - b.pixels).map((r) => ({ x: r.pixels / 1e6, y: r.totalMedian, lo: r.totalMin, hi: r.totalMax }));
    charts['chart-recognition'] = lineChart({
      title: 'Розпізнавання: час залежно від кількості пікселів',
      xLabel: 'кількість пікселів, Мп',
      yLabel: 'час розпізнавання, мс (медіана, мін-макс)',
      xTicks: [0.3, 0.9, 2.1, 8.3],
      series: [
        { name: 'PNG', points: mk('png', res) },
        { name: 'JPG', points: mk('jpg', res) },
        { name: 'BMP', points: mk('bmp', res) },
        { name: 'PNG із шумом', points: mk('png', noise), filled: false },
        { name: 'JPG із шумом', points: mk('jpg', noise), filled: false },
      ],
    });
    const bmpClass = rows.filter((r) => r.group === 'BMP за розміром файлу').sort((a, b) => a.fileBytes - b.fileBytes);
    charts['chart-recognition-bmp'] = lineChart({
      title: 'Розпізнавання BMP: час залежно від розміру файлу',
      xLabel: 'розмір файлу, МБ',
      yLabel: 'час розпізнавання, мс (медіана)',
      xTicks: bmpClass.map((r) => Number(r.fileMb.toFixed(2))),
      series: [{ name: 'BMP', points: bmpClass.map((r) => ({ x: r.fileMb, y: r.totalMedian, lo: r.totalMin, hi: r.totalMax })) }],
    });
  }

  if (has('parallel-workers')) {
    const rows = read('parallel-workers');
    charts['chart-workers-time'] = lineChart({
      title: 'Підготовка 900 зображень: час залежно від кількості воркерів',
      xLabel: 'кількість воркерів (0 це головний потік)',
      yLabel: 'час підготовки, мс (медіана, мін-макс)',
      xTicks: rows.map((r) => r.workers),
      series: [{ name: 'час', points: rows.map((r) => ({ x: r.workers, y: r.median, lo: r.min, hi: r.max })) }],
    });
    const w = rows.filter((r) => r.workers >= 1);
    charts['chart-workers-speedup'] = lineChart({
      title: 'Прискорення підготовки відносно одного воркера',
      xLabel: 'кількість воркерів',
      yLabel: 'прискорення, разів',
      xTicks: w.map((r) => r.workers),
      yMin: 0,
      series: [
        { name: 'виміряне', points: w.map((r) => ({ x: r.workers, y: r.speedupVsOne })) },
        { name: 'ідеальне', points: w.map((r) => ({ x: r.workers, y: r.workers })), filled: false },
      ],
    });
  }

  if (has('parallel-chunk')) {
    const rows = read('parallel-chunk');
    charts['chart-chunk'] = lineChart({
      title: 'Вплив розміру порції на час підготовки (8 воркерів)',
      xLabel: 'розмір порції, зображень (логарифмічна шкала)',
      yLabel: 'час підготовки, мс (медіана, мін-макс)',
      xLog: true,
      series: [{ name: 'час', points: rows.map((r) => ({ x: r.chunkSize, y: r.median, lo: r.min, hi: r.max })) }],
    });
  }

  if (has('parallel-scale')) {
    const rows = read('parallel-scale');
    const mk = (workers) => rows.filter((r) => r.workers === workers).map((r) => ({ x: r.images, y: r.median, lo: r.min, hi: r.max }));
    charts['chart-scale'] = lineChart({
      title: 'Підготовка даних: час залежно від кількості зображень',
      xLabel: 'кількість зображень',
      yLabel: 'час підготовки, мс (медіана, мін-макс)',
      xTicks: [...new Set(rows.map((r) => r.images))],
      series: [{ name: 'головний потік', points: mk(0) }, { name: '8 воркерів', points: mk(8) }],
    });
  }

  if (has('responsiveness')) {
    const rows = read('responsiveness');
    charts['chart-responsive'] = barChart({
      title: 'Чутливість інтерфейсу: найбільша пауза між кадрами',
      yLabel: 'пауза між кадрами, мс (медіана)',
      categories: rows.map((r) => r.scenario.replace('підготовка: ', 'підготовка: ')),
      series: [{ name: 'найбільша пауза', values: rows.map((r) => r.maxGap) }, { name: 'найдовша задача', values: rows.map((r) => r.longestTask) }],
      valueFormat: (v) => String(Math.round(v)),
    });
  }

  if (has('training-epochs')) {
    const rows = read('training-epochs');
    charts['chart-epochs-accuracy'] = lineChart({
      title: 'Точність залежно від кількості епох (швидкість навчання 0,3)',
      xLabel: 'кількість епох (логарифмічна шкала)',
      yLabel: 'точність (середнє по 5 наборах, мін-макс)',
      xLog: true,
      yMin: 0.4,
      yMax: 1.02,
      yFormat: pct,
      legendPos: 'br',
      series: [
        { name: 'на тестовій частині набору', points: rows.map((r) => ({ x: r.epochsSetting, y: r.accuracy, lo: r.accuracyMin, hi: r.accuracyMax })) },
        { name: 'на складному тесті (малі виступи)', points: rows.map((r) => ({ x: r.epochsSetting, y: r.hardAccuracy, lo: r.hardAccuracyMin, hi: r.hardAccuracyMax })) },
      ],
    });
    charts['chart-epochs-error'] = lineChart({
      title: 'Помилка навчання та час залежно від кількості епох',
      xLabel: 'кількість епох (логарифмічна шкала)',
      yLabel: 'помилка навчання',
      xLog: true,
      series: [{ name: 'помилка навчання', points: rows.map((r) => ({ x: r.epochsSetting, y: r.error })) }],
    });
  }

  if (has('training-lr')) {
    const rows = read('training-lr');
    charts['chart-lr-epochs'] = lineChart({
      title: 'Кількість епох до зупинки залежно від швидкості навчання',
      xLabel: 'швидкість навчання (логарифмічна шкала)',
      yLabel: 'виконано епох (ліміт 2000)',
      xLog: true,
      series: [{ name: 'епох до порогу 0,005', points: rows.map((r) => ({ x: r.learningRate, y: r.epochs, lo: r.epochsMin, hi: r.epochsMax })) }],
    });
  }

  if (has('training-size')) {
    const rows = read('training-size');
    charts['chart-size'] = lineChart({
      title: 'Точність залежно від розміру навчального набору',
      xLabel: 'кількість зображень у наборі (логарифмічна шкала)',
      yLabel: 'точність (середнє по 5 наборах, мін-макс)',
      xLog: true,
      yMin: 0.4,
      yMax: 1.02,
      yFormat: pct,
      legendPos: 'br',
      series: [
        { name: 'на тестовій частині набору', points: rows.map((r) => ({ x: r.images, y: r.accuracy, lo: r.accuracyMin, hi: r.accuracyMax })) },
        { name: 'на складному тесті (малі виступи)', points: rows.map((r) => ({ x: r.images, y: r.hardAccuracy, lo: r.hardAccuracyMin, hi: r.hardAccuracyMax })) },
      ],
    });
  }

  if (has('robust-spike')) {
    const rows = read('robust-spike');
    const mk = (w) => rows.filter((r) => r.spikeWidth === w).map((r) => ({ x: r.spikeLength * 100, y: r.detected }));
    charts['chart-spike'] = lineChart({
      title: 'Частка виявлених виступів залежно від їхньої довжини',
      xLabel: 'довжина виступу, % від розміру зображення',
      yLabel: 'частка виявлених дефектів',
      xTicks: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12],
      yMin: 0,
      yMax: 1.05,
      yFormat: pct,
      series: [{ name: 'ширина 3%', points: mk(0.03) }, { name: 'ширина 5%', points: mk(0.05) }],
    });
  }

  if (has('robust-shift')) {
    const rows = read('robust-shift');
    charts['chart-shift'] = lineChart({
      title: 'Хибні спрацювання при зсуві кола від центру',
      xLabel: 'зсув центру, % від розміру зображення',
      yLabel: 'частка нормальних зображень, визнаних дефектними',
      yMin: 0,
      yMax: 1.05,
      yFormat: pct,
      series: [{ name: 'хибні спрацювання', points: rows.map((r) => ({ x: r.shift * 100, y: r.falsePositive })) }],
    });
  }

  if (has('robust-noise')) {
    const rows = read('robust-noise');
    charts['chart-noise'] = lineChart({
      title: 'Вплив шуму на розпізнавання',
      legendPos: 'br',
      xLabel: 'стандартне відхилення шуму, рівнів яскравості',
      yLabel: 'частка',
      yMin: 0,
      yMax: 1.05,
      yFormat: pct,
      series: [
        { name: 'виявлено дефектів', points: rows.map((r) => ({ x: r.noiseSigma, y: r.detected })) },
        { name: 'хибні спрацювання', points: rows.map((r) => ({ x: r.noiseSigma, y: r.falsePositive })) },
      ],
    });
  }

  if (has('robust-jpg')) {
    const rows = read('robust-jpg');
    charts['chart-jpg'] = lineChart({
      title: 'Вплив якості стиснення JPG',
      legendPos: 'mr',
      xLabel: 'якість JPG (0-1)',
      yLabel: 'частка',
      yMin: 0,
      yMax: 1.05,
      yFormat: pct,
      xTicks: rows.map((r) => r.jpgQuality),
      series: [
        { name: 'виявлено дефектів', points: rows.map((r) => ({ x: r.jpgQuality, y: r.detected })) },
        { name: 'хибні спрацювання', points: rows.map((r) => ({ x: r.jpgQuality, y: r.falsePositive })) },
      ],
    });
  }

  return charts;
}

export async function renderCharts() {
  const charts = buildCharts();
  const dir = path.join(RESULTS, 'charts');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  for (const [name, svg] of Object.entries(charts)) {
    fs.writeFileSync(path.join(dir, `${name}.svg`), svg);
    await page.setContent(`<body style="margin:0;background:#fff">${svg}</body>`);
    await page.screenshot({ path: path.join(dir, `${name}.png`), clip: { x: 0, y: 0, width: W, height: H } });
  }
  await browser.close();
  return Object.keys(charts);
}

if (process.argv[1] && process.argv[1].endsWith('charts.mjs')) {
  const names = await renderCharts();
  console.log(`Побудовано графіків: ${names.length}\n${names.join('\n')}`);
}
