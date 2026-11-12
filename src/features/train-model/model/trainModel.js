import { logAdded } from '@/entities/log';
import {
  modelAdded,
  prepProgressed,
  trainStarted,
  trainingFailed,
  trainingFinished,
  trainingProgressed,
  trainingStarted,
} from '@/entities/model';
import { markModelLoaded, prepareDataset, trainInWorker } from '@/shared/api/ml';
import { DATASET_GROUPS } from '@/shared/config/ml.js';
import { formatBytes, formatMs } from '@/shared/lib/format.js';
import { SHAPE_LABELS } from '@/shared/lib/ml/shapes.js';
import { buildTasks } from '@/shared/lib/ml/tasks.js';
import { savePayload } from '@/shared/lib/storage/models.js';

export const describeMode = (workers) => (workers === 0 ? 'головний потік (без розпаралелення)' : `Web Workers × ${workers}`);

export const trainModel = () => async (dispatch, getState) => {
  const { config } = getState().model;
  const tasks = buildTasks(config);
  const workers = config.mode === 'main' ? 0 : config.workers;
  const groups = DATASET_GROUPS.filter((g) => config.groups.includes(g.id))
    .map((g) => `${g.label} ${g.size}×${g.size}`)
    .join(', ');
  const log = (message, level) => dispatch(logAdded(message, level));

  const started = performance.now();
  dispatch(trainingStarted({ startedAt: Date.now(), total: tasks.length }));
  log(`Старт навчання: ${tasks.length} зображень (${groups}), формат: ${config.format}, фігури: ${config.shapes.join(', ')}, варіативність: ${config.variety}`);
  log(`Підготовка даних: ${describeMode(workers)}. Епох: ${config.epochs}, швидкість навчання: ${config.learningRate}`);

  try {
    let nextLogAt = 0.25;
    const samples = await prepareDataset(tasks, {
      workers,
      onProgress: (done, total) => {
        dispatch(prepProgressed({ done, total }));
        if (done / total >= nextLogAt && done < total) {
          log(`Оброблено ${done}/${total} зображень`);
          nextLogAt += 0.25;
        }
      },
    });
    const prepMs = performance.now() - started;
    const bytes = samples.reduce((sum, s) => sum + s.bytes, 0);
    log(`Підготовку завершено за ${formatMs(prepMs)}: ${samples.length} зображень, ${formatBytes(bytes)} у файлах`, 'success');

    dispatch(trainStarted());
    let lastQuarter = 0;
    const metrics = await trainInWorker(samples, config, ({ epoch, epochs, error }) => {
      dispatch(trainingProgressed({ epoch, epochs, error }));
      const quarter = Math.floor((epoch / epochs) * 4);
      if (quarter > lastQuarter) {
        lastQuarter = quarter;
        log(`Епоха ${epoch}/${epochs}, помилка ${error.toFixed(4)}`);
      }
    });

    const totalMs = performance.now() - started;
    const { netJson, normalizer, ...rest } = metrics;
    const fullMetrics = { ...rest, prepMs, totalMs, imageCount: samples.length, workers };
    dispatch(trainingFinished(fullMetrics));
    log(
      `Навчання завершено: ${metrics.epochs} епох за ${formatMs(metrics.trainMs)}, точність на тесті ${(metrics.accuracy * 100).toFixed(1)}%, разом ${formatMs(totalMs)}`,
      'success',
    );

    const id = crypto.randomUUID();
    const shapeNames = config.shapes.map((s) => SHAPE_LABELS[s]).join(', ');
    const name = `Модель ${getState().model.seq + 1} · ${shapeNames}`;
    try {
      savePayload(id, { netJson, normalizer });
      dispatch(modelAdded({ id, name, createdAt: new Date().toISOString(), config: { ...config }, metrics: fullMetrics }));
      markModelLoaded(id);
      log(`Модель «${name}» збережено у браузері й обрано для розпізнавання`, 'success');
    } catch (error) {
      log(`Модель не збережено (сховище браузера недоступне або заповнене): ${error.message}`, 'warn');
    }
  } catch (error) {
    dispatch(trainingFailed(error.message));
    log(`Помилка навчання: ${error.message}`, 'error');
  }
};
