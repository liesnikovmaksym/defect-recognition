import { histogram } from './histogram.js';

export function differenceImages(gray, reference) {
  const excess = new Uint8ClampedArray(gray.length);
  const deficit = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i += 1) {
    const d = gray[i] - reference[i];
    if (d > 0) excess[i] = d;
    else deficit[i] = -d;
  }
  return { excess, deficit };
}

export const absoluteDifference = (gray, reference) => {
  const out = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i += 1) out[i] = Math.abs(gray[i] - reference[i]);
  return out;
};

function cumulativeOfNonZero(diff, bins) {
  const counts = histogram(diff, bins);
  const out = [];
  let acc = 0;
  for (let k = 1; k < bins; k += 1) {
    acc += counts[k];
    out.push(acc / diff.length);
  }
  return out;
}

export function diffHistogramFeatures(gray, reference, bins) {
  const { excess, deficit } = differenceImages(gray, reference);
  return [...cumulativeOfNonZero(excess, bins), ...cumulativeOfNonZero(deficit, bins)];
}

export const diffBinsFromLength = (length) => length / 2 + 1;
