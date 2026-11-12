import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { clearImage, loadImageFile } from '@/entities/image';
import { logAdded } from '@/entities/log';
import { modelAdded, modelRemoved, modelRenamed, modelSelected, selectLibrary } from '@/entities/model';
import { resultReset } from '@/entities/recognition';
import { formatBytes } from '@/shared/lib/format.js';
import { saveIndex } from '@/shared/lib/storage/models.js';

export const appListener = createListenerMiddleware();

appListener.startListening({
  actionCreator: loadImageFile.fulfilled,
  effect: ({ payload }, api) => {
    const { name, size, width, height } = payload.meta;
    const source = { generated: 'згенероване', drawn: 'намальоване' }[payload.meta.source] ?? 'завантажене';
    api.dispatch(logAdded(`Зображення (${source}): ${name}, ${formatBytes(size)}, ${width}×${height}`, 'info'));
  },
});

appListener.startListening({
  actionCreator: loadImageFile.rejected,
  effect: ({ error }, api) => {
    api.dispatch(logAdded(`Помилка завантаження зображення: ${error.message}`, 'error'));
  },
});

appListener.startListening({
  matcher: isAnyOf(modelAdded, modelSelected, modelRenamed, modelRemoved),
  effect: (_, api) => {
    saveIndex(selectLibrary(api.getState()));
  },
});

appListener.startListening({
  matcher: isAnyOf(loadImageFile.fulfilled, clearImage.fulfilled),
  effect: (_, api) => {
    api.dispatch(resultReset());
  },
});
