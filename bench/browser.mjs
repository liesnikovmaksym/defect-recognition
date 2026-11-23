import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function startApp(port = 5310) {
  const server = await createServer({ root: ROOT, logLevel: 'error', server: { port, strictPort: true } });
  await server.listen();
  return { url: `http://localhost:${port}/`, close: () => server.close() };
}

export async function launchBrowser() {
  const executablePath = process.env.BROWSER_PATH;
  return chromium.launch(executablePath ? { executablePath } : { channel: 'msedge' });
}

export const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

export const stats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance = sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1);
  return { n, min: sorted[0], max: sorted[n - 1], mean, median, std: Math.sqrt(variance) };
};

export const PAGE_HELPERS = `
(async () => {
  const ml = await import('/src/shared/api/ml/index.js');
  const tasks = await import('/src/shared/lib/ml/tasks.js');
  const shapes = await import('/src/shared/lib/ml/shapes.js');
  const bmp = await import('/src/shared/lib/image/bmp.js');
  const rng = await import('/src/shared/lib/ml/rng.js');
  const pipeline = await import('/src/shared/lib/ml/pipeline.js');
  const MIME = { png: 'image/png', jpg: 'image/jpeg', bmp: 'image/bmp' };

  const encode = async (canvas, format, quality = 0.9) => {
    if (format === 'bmp') {
      const ctx = canvas.getContext('2d');
      return bmp.encodeBmp(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
    return canvas.convertToBlob({ type: MIME[format], quality });
  };

  const makeCanvas = (width, height, draw) => {
    const canvas = new OffscreenCanvas(width, height);
    draw(canvas.getContext('2d'), canvas);
    return canvas;
  };

  const makeFile = async ({ size = 256, width, height, format = 'png', defect = false, seed = 1, dark = false, quality = 0.9, spec: given, draw }) => {
    const w = width ?? size;
    const h = height ?? size;
    const spec = given ?? shapes.randomSpec(rng.createRng(seed), { defective: defect, variety: 'extended', shapes: ['circle'], aligned: true });
    const canvas = makeCanvas(w, h, (ctx) => {
      if (w === h) shapes.drawSpec(ctx, spec, w, dark ? { fg: '#000000', bg: '#ffffff' } : undefined);
      else {
        ctx.fillStyle = dark ? '#ffffff' : '#000000';
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate((w - h) / 2, 0);
        shapes.drawSpec(ctx, spec, h, dark ? { fg: '#000000', bg: '#ffffff' } : undefined);
        ctx.restore();
      }
      if (draw) draw(ctx, w, h);
    });
    const blob = await encode(canvas, format, quality);
    return new File([blob], 'test-' + (defect ? 'defect' : 'normal') + '-' + w + 'x' + h + '.' + format, { type: MIME[format] });
  };

  window.__t = { ml, tasks, shapes, bmp, rng, pipeline, makeFile, makeCanvas, encode, MIME };
})()
`;

export const setupPage = async (page, url) => {
  await page.goto(url);
  await page.evaluate(PAGE_HELPERS);
};
