import { createRng } from './rng.js';

export function fitNormalizer(samples) {
  const n = samples[0].features.length;
  const min = new Array(n).fill(Infinity);
  const max = new Array(n).fill(-Infinity);
  for (const { features } of samples) {
    features.forEach((v, i) => {
      if (v < min[i]) min[i] = v;
      if (v > max[i]) max[i] = v;
    });
  }
  return { min, max };
}

export function applyNormalizer({ min, max }, features) {
  // (v - min) / (max - min)
  return features.map((v, i) => {
    const span = max[i] - min[i];
    if (span < 1e-9) return 0;
    return Math.min(1, Math.max(0, (v - min[i]) / span)); 
  });
}

export function splitSamples(samples, trainRatio = 0.8, seed = 42) {
  const rand = createRng(seed);
  const shuffled = samples.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const cut = Math.floor(shuffled.length * trainRatio);
  return { train: shuffled.slice(0, cut), test: shuffled.slice(cut) };
}
