import { FILE_FORMATS, MIXED_FORMAT, TRAIN_SIZE } from '@/shared/config/ml.js';
import { encodeBmp } from '@/shared/lib/image/bmp.js';
import { absoluteDifference, diffHistogramFeatures } from './diff.js';
import { cumulativeHistogram, normalizePolarity, rgbaToGray } from './histogram.js';
import { createRng } from './rng.js';
import { drawSpec, nominalSpec, randomSpec } from './shapes.js';

export function downscaleToGray(source) {
  const canvas = new OffscreenCanvas(TRAIN_SIZE, TRAIN_SIZE);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, TRAIN_SIZE, TRAIN_SIZE);
  const rgba = ctx.getImageData(0, 0, TRAIN_SIZE, TRAIN_SIZE).data;
  return normalizePolarity(rgbaToGray(rgba), TRAIN_SIZE, TRAIN_SIZE);
}

export async function decodeToGray(blob) {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  const gray = downscaleToGray(bitmap);
  bitmap.close();
  return { gray, width, height };
}

const referenceCache = new Map();

export function referenceGray(type) {
  if (!referenceCache.has(type)) {
    const size = 256;
    const canvas = new OffscreenCanvas(size, size);
    drawSpec(canvas.getContext('2d'), nominalSpec(type), size);
    referenceCache.set(type, downscaleToGray(canvas));
  }
  return referenceCache.get(type);
}

export function computeFeatures(gray, { refType, bins }) {
  return diffHistogramFeatures(gray, referenceGray(refType), bins);
}

export function displayCumulative(gray, { refType, bins }) {
  return cumulativeHistogram(absoluteDifference(gray, referenceGray(refType)), bins);
}

function encodeCanvas(canvas, format) {
  if (format === 'bmp') {
    const ctx = canvas.getContext('2d');
    return encodeBmp(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }
  return canvas.convertToBlob({ type: format === 'jpg' ? 'image/jpeg' : 'image/png', quality: 0.9 });
}

export async function prepareSample({ id, index, group, format, variety, shapes, bins, singleBias, seed }) {
  const rand = createRng(seed);
  const label = index % 2 === 0 ? 'normal' : 'defect';
  const spec = randomSpec(rand, { defective: label === 'defect', variety, shapes, singleBias, aligned: true });

  const canvas = new OffscreenCanvas(group.size, group.size);
  drawSpec(canvas.getContext('2d'), spec, group.size);

  const fileFormat = format === MIXED_FORMAT ? FILE_FORMATS[id % FILE_FORMATS.length].value : format;
  const blob = await encodeCanvas(canvas, fileFormat);
  const { gray } = await decodeToGray(blob);

  return {
    id,
    label,
    group: group.id,
    format: fileFormat,
    bytes: blob.size,
    features: computeFeatures(gray, { refType: shapes[0], bins }),
  };
}
