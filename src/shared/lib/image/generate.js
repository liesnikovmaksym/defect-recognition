import { createRng } from '../ml/rng.js';
import { drawSpec, randomSpec } from '../ml/shapes.js';

export const SAMPLE_RESOLUTIONS = [64, 256, 1024, 2048, 4096];

export function generateSampleFile({ type, defective, resolution, invert = false }) {
  const rand = createRng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
  const spec = randomSpec(rand, { type, defective, aligned: true });
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  drawSpec(ctx, spec, resolution, invert ? { fg: '#000000', bg: '#ffffff' } : undefined);

  const name = `${type}-${defective ? 'defect' : 'normal'}-${resolution}px.png`;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(new File([blob], name, { type: 'image/png' })) : reject(new Error('Помилка генерації'))),
      'image/png',
    );
  });
}
