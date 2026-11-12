import { configureStore } from '@reduxjs/toolkit';
import { imageReducer } from '@/entities/image';
import { logReducer } from '@/entities/log';
import { modelReducer } from '@/entities/model';
import { recognitionReducer } from '@/entities/recognition';
import { appListener } from './listeners.js';

export const store = configureStore({
  reducer: {
    image: imageReducer,
    log: logReducer,
    model: modelReducer,
    recognition: recognitionReducer,
  },
  middleware: (getDefault) => getDefault().prepend(appListener.middleware),
});
