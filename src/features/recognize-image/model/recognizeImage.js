import { logAdded } from '@/entities/log';
import { selectActiveModel } from '@/entities/model';
import {
  recognitionFailed,
  recognitionFinished,
  recognitionProgressed,
  recognitionStarted,
} from '@/entities/recognition';
import { recognizeInWorker } from '@/shared/api/ml';
import { formatBytes, formatMs, formatPercent } from '@/shared/lib/format.js';
import { getCurrentFile } from '@/shared/lib/image/fileStore.js';
import { createThumbnail } from '@/shared/lib/image/thumbnail.js';
import { loadPayload } from '@/shared/lib/storage/models.js';

export const recognizeImage = () => async (dispatch, getState) => {
  const file = getCurrentFile();
  const { meta } = getState().image;
  const model = selectActiveModel(getState());
  if (!file || !meta || !model) return;

  dispatch(recognitionStarted());
  dispatch(
    logAdded(`Розпізнавання: ${meta.name} (${formatBytes(meta.size)}, ${meta.width}×${meta.height}), модель «${model.name}»`),
  );
  try {
    const result = await recognizeInWorker(
      file,
      { id: model.id, getPayload: () => loadPayload(model.id) },
      (p) => dispatch(recognitionProgressed(p)),
    );
    const url = URL.createObjectURL(file);
    const thumbUrl = await createThumbnail(file).catch(() => url);
    dispatch(
      recognitionFinished({
        result: { ...result, modelName: model.name },
        image: { name: meta.name, size: meta.size, url, thumbUrl },
      }),
    );
    dispatch(
      logAdded(
        `Результат: ${result.label === 'defect' ? 'дефект' : 'без дефекту'} (${formatPercent(result.scores[result.label])}), час ${formatMs(result.totalMs)}`,
        result.label === 'defect' ? 'warn' : 'success',
      ),
    );
  } catch (error) {
    dispatch(recognitionFailed(error.message));
    dispatch(logAdded(`Помилка розпізнавання: ${error.message}`, 'error'));
  }
};
