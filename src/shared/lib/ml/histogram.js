export const BINS = 32;

export function normalizePolarity(gray, width, height) {
  let sum = 0;
  let count = 0;
  for (let x = 0; x < width; x += 1) {
    sum += gray[x] + gray[(height - 1) * width + x];
    count += 2;
  }
  for (let y = 1; y < height - 1; y += 1) {
    sum += gray[y * width] + gray[y * width + width - 1];
    count += 2;
  }
  if (sum / count <= 127) return gray;
  const out = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i += 1) out[i] = 255 - gray[i];
  return out;
}

export function rgbaToGray(rgba) {
  const gray = new Uint8ClampedArray(rgba.length / 4);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 1) {
    gray[j] = Math.round(0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]);
  }
  return gray;
}

export function histogram(gray, bins = BINS) {
  const counts = new Array(bins).fill(0);
  const step = 256 / bins;
  for (let i = 0; i < gray.length; i += 1) {
    counts[Math.min(bins - 1, Math.floor(gray[i] / step))] += 1;
  }
  return counts;
}

export function cumulativeHistogram(gray, bins = BINS) {
  const counts = histogram(gray, bins);
  const total = gray.length;
  const out = new Array(bins);
  let acc = 0;
  for (let k = 0; k < bins; k += 1) {
    acc += counts[k];
    out[k] = acc / total;
  }
  return out;
}
