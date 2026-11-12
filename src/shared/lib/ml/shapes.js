import { randRange } from './rng.js';

export const CLASSES = ['normal', 'defect'];

export const BASIC_TYPES = ['circle', 'square'];

export const SHAPE_LABELS = {
  circle: 'Круг',
  ellipse: 'Еліпс',
  square: 'Квадрат',
  rectangle: 'Прямокутник',
  triangle: 'Трикутник',
  hexagon: 'Шестикутник',
};

const SPIKE_START = 0.5;
const TWO_PI = Math.PI * 2;
const POLYGON_SIDES = { triangle: 3, hexagon: 6 };
const POLYGON_SCALE = { triangle: 1.3, hexagon: 1.05 };

function boundaryDistance(spec, theta) {
  const phi = theta - spec.rot;
  switch (spec.type) {
    case 'circle':
      return spec.r;
    case 'ellipse': {
      const a = spec.r;
      const b = spec.r * spec.aspect;
      return (a * b) / Math.hypot(b * Math.cos(phi), a * Math.sin(phi));
    }
    case 'square':
    case 'rectangle': {
      const a = spec.r;
      const b = spec.r * spec.aspect;
      return Math.min(a / Math.max(Math.abs(Math.cos(phi)), 1e-6), b / Math.max(Math.abs(Math.sin(phi)), 1e-6));
    }
    default: {
      const n = POLYGON_SIDES[spec.type];
      const R = spec.r * POLYGON_SCALE[spec.type];
      const sector = TWO_PI / n;
      const local = ((((phi % sector) + sector) % sector) - sector / 2);
      return (R * Math.cos(Math.PI / n)) / Math.cos(local);
    }
  }
}

const spikeEnd = (spec, spike) => boundaryDistance(spec, spike.angle) + spike.len;

export function nominalSpec(type) {
  return {
    type,
    cx: 0.5,
    cy: 0.5,
    r: 0.3,
    rot: 0,
    aspect: type === 'ellipse' || type === 'rectangle' ? 0.7 : 1,
    spikes: [],
  };
}

export function randomSpec(
  rand,
  { defective, type, shapes = BASIC_TYPES, variety = 'basic', singleBias = 0, aligned = false } = {},
) {
  const extended = variety === 'extended' || (type !== undefined && !BASIC_TYPES.includes(type));
  const shape = type ?? shapes[Math.floor(rand() * shapes.length)];

  const spec = {
    type: shape,
    cx: randRange(rand, 0.44, 0.56),
    cy: randRange(rand, 0.44, 0.56),
    r: extended ? randRange(rand, 0.27, 0.33) : randRange(rand, 0.295, 0.305),
    rot: 0,
    aspect: 1,
    spikes: [],
  };
  if (extended) {
    if (shape !== 'circle') spec.rot = randRange(rand, 0, TWO_PI);
    if (shape === 'ellipse' || shape === 'rectangle') spec.aspect = randRange(rand, 0.6, 0.85);
  }
  if (aligned) Object.assign(spec, nominalSpec(shape));

  if (defective) {
    const count = rand() < singleBias ? 1 : 1 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i += 1) {
      spec.spikes.push(
        extended
          ? {
              kind: rand() < 0.3 ? 'blob' : 'spike',
              angle: randRange(rand, 0, TWO_PI),
              len: randRange(rand, 0.04, 0.14),
              wid: randRange(rand, 0.025, 0.08),
            }
          : {
              kind: 'spike',
              angle: randRange(rand, 0, TWO_PI),
              len: randRange(rand, 0.06, 0.13),
              wid: randRange(rand, 0.04, 0.08),
            },
      );
    }
  }
  return spec;
}

function drawBase(ctx, spec, size) {
  const cx = spec.cx * size;
  const cy = spec.cy * size;
  const r = spec.r * size;
  ctx.beginPath();
  switch (spec.type) {
    case 'circle':
      ctx.arc(cx, cy, r, 0, TWO_PI);
      break;
    case 'ellipse':
      ctx.ellipse(cx, cy, r, r * spec.aspect, spec.rot, 0, TWO_PI);
      break;
    case 'square':
    case 'rectangle':
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(spec.rot);
      ctx.rect(-r, -r * spec.aspect, r * 2, r * spec.aspect * 2);
      ctx.restore();
      break;
    default: {
      const n = POLYGON_SIDES[spec.type];
      const R = r * POLYGON_SCALE[spec.type];
      for (let k = 0; k < n; k += 1) {
        const angle = spec.rot + (TWO_PI * k) / n;
        const x = cx + R * Math.cos(angle);
        const y = cy + R * Math.sin(angle);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
  }
  ctx.fill();
}

export function drawSpec(ctx, spec, size, { fg = '#ffffff', bg = '#000000' } = {}) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = fg;
  drawBase(ctx, spec, size);

  const cx = spec.cx * size;
  const cy = spec.cy * size;
  for (const spike of spec.spikes) {
    const start = boundaryDistance(spec, spike.angle) * SPIKE_START * size;
    const end = spikeEnd(spec, spike) * size;
    const wid = spike.wid * size;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spike.angle);
    if (spike.kind === 'blob') {
      const neckEnd = start + (end - start) * 0.6;
      ctx.fillRect(start, -wid * 0.25, neckEnd - start, wid * 0.5);
      ctx.beginPath();
      ctx.arc(neckEnd, 0, wid * 0.8, 0, TWO_PI);
      ctx.fill();
    } else {
      ctx.fillRect(start, -wid / 2, end - start, wid);
    }
    ctx.restore();
  }
}
