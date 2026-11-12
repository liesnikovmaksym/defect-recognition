import { createAsyncThunk } from '@reduxjs/toolkit';
import { getExtension } from '@/shared/lib/format.js';
import { setCurrentFile } from '@/shared/lib/image/fileStore.js';

export const clearImage = createAsyncThunk('image/clear', async (_, { getState }) => {
  const url = getState().image.previewUrl;
  if (url) URL.revokeObjectURL(url);
  setCurrentFile(null);
});

export const loadImageFile = createAsyncThunk('image/loadFile', async ({ file, source }, { getState }) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Обраний файл не є зображенням');
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Браузер не зміг прочитати це зображення');
  }
  const { width, height } = bitmap;
  bitmap.close();

  const oldUrl = getState().image.previewUrl;
  if (oldUrl) URL.revokeObjectURL(oldUrl);

  setCurrentFile(file);
  return {
    previewUrl: URL.createObjectURL(file),
    meta: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: getExtension(file.name),
      width,
      height,
      lastModified: file.lastModified,
      source,
    },
  };
});
