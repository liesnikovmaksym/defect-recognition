import brain from 'brain.js/dist/neural-network.js';
import { CLASSES } from '@/shared/lib/ml/shapes.js';
import { applyNormalizer, fitNormalizer, splitSamples } from '@/shared/lib/ml/dataset.js';
import { FEATURE_MODE, RECOGNITION_STEPS } from '@/shared/config/ml.js';

const [STEP_DECODE, STEP_FEATURES, STEP_CLASSIFY] = RECOGNITION_STEPS;
import { diffBinsFromLength } from '@/shared/lib/ml/diff.js';
import { computeFeatures, decodeToGray, displayCumulative } from '@/shared/lib/ml/pipeline.js';

const NeuralNetwork = brain.NeuralNetwork ?? brain.default ?? brain;

let net = null;
let normalizer = null;

const reply = (id, type, data) => self.postMessage({ id, type, ...data });

function argmax(scores) {
  return CLASSES.reduce((best, name) => (scores[name] > scores[best] ? name : best), CLASSES[0]);
}

function tally(table, key, ok) {
  table[key] ??= { correct: 0, total: 0 };
  table[key].total += 1;
  if (ok) table[key].correct += 1;
}

function train(id, { samples, config }) {
  const started = performance.now();
  const { train: trainSet, test: testSet } = splitSamples(samples);
  normalizer = { ...fitNormalizer(trainSet), mode: FEATURE_MODE, refType: config.shapes[0] };

  const toData = (s) => ({ input: applyNormalizer(normalizer, s.features), output: { [s.label]: 1 } });
  net = new NeuralNetwork({ hiddenLayers: [] });

  const stats = net.train(trainSet.map(toData), {
    iterations: config.epochs,
    errorThresh: 0.005,
    learningRate: config.learningRate,
    callbackPeriod: Math.max(1, Math.floor(config.epochs / 100)),
    callback: ({ iterations: epoch, error }) => reply(id, 'progress', { epoch, epochs: config.epochs, error }),
  });

  const confusion = { normal: { normal: 0, defect: 0 }, defect: { normal: 0, defect: 0 } };
  const byGroup = {};
  const byFormat = {};
  let correct = 0;
  for (const sample of testSet) {
    const predicted = argmax(net.run(applyNormalizer(normalizer, sample.features)));
    const ok = predicted === sample.label;
    confusion[sample.label][predicted] += 1;
    tally(byGroup, sample.group, ok);
    tally(byFormat, sample.format, ok);
    if (ok) correct += 1;
  }

  reply(id, 'done', {
    result: {
      accuracy: correct / testSet.length,
      confusion,
      byGroup,
      byFormat,
      trainError: stats.error,
      epochs: stats.iterations,
      trainSize: trainSet.length,
      testSize: testSet.length,
      trainMs: performance.now() - started,
      netJson: net.toJSON(),
      normalizer,
    },
  });
}

async function recognize(id, { blob, model }) {
  if (model) {
    net = new NeuralNetwork();
    net.fromJSON(model.netJson);
    normalizer = model.normalizer;
  }
  if (!net) throw new Error('Модель не завантажена. Навчіть або оберіть модель.');
  const total = performance.now();
  const steps = {};
  let mark = total;
  const lap = (name) => {
    const now = performance.now();
    steps[name] = now - mark;
    mark = now;
  };

  reply(id, 'progress', STEP_DECODE);
  const { gray, width, height } = await decodeToGray(blob);
  lap('decode');

  reply(id, 'progress', STEP_FEATURES);
  if (normalizer.mode !== FEATURE_MODE) {
    throw new Error('Модель створена старою версією застосунку. Навчіть її заново.');
  }
  const bins = diffBinsFromLength(normalizer.min.length);
  const { refType } = normalizer;
  const features = computeFeatures(gray, { refType, bins });
  const cumulative = displayCumulative(gray, { refType, bins });
  lap('histogram');

  reply(id, 'progress', STEP_CLASSIFY);
  const scores = net.run(applyNormalizer(normalizer, features));
  const label = argmax(scores);
  lap('predict');

  reply(id, 'done', {
    result: {
      label,
      scores: { normal: scores.normal, defect: scores.defect },
      cumulative,
      width,
      height,
      steps,
      totalMs: performance.now() - total,
    },
  });
}

self.onmessage = async ({ data }) => {
  const { id, type, payload } = data;
  try {
    if (type === 'train') train(id, payload);
    else if (type === 'recognize') await recognize(id, payload);
  } catch (error) {
    reply(id, 'error', { message: error.message });
  }
};
