import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: 'idle',
  stage: '',
  progress: 0,
  result: null,
  error: null,
  history: [],
};

let entryId = 0;

const slice = createSlice({
  name: 'recognition',
  initialState,
  reducers: {
    recognitionStarted(state) {
      state.status = 'running';
      state.stage = 'Запуск';
      state.progress = 0;
      state.error = null;
    },
    recognitionProgressed(state, { payload }) {
      state.stage = payload.stage;
      state.progress = payload.value;
    },
    recognitionFinished(state, { payload }) {
      const { result, image } = payload;
      state.status = 'done';
      state.stage = 'Готово';
      state.progress = 1;
      state.result = result;
      entryId += 1;
      state.history.unshift({
        id: entryId,
        time: new Date().toISOString(),
        name: image.name,
        size: image.size,
        url: image.url,
        thumbUrl: image.thumbUrl,
        width: result.width,
        height: result.height,
        modelName: result.modelName,
        label: result.label,
        confidence: result.scores[result.label],
        totalMs: result.totalMs,
      });
    },
    recognitionFailed(state, { payload }) {
      state.status = 'error';
      state.error = payload;
    },
    resultReset: (state) => ({ ...initialState, history: state.history }),
    historyCleared(state) {
      state.history = [];
    },
  },
});

export const {
  recognitionStarted,
  recognitionProgressed,
  recognitionFinished,
  recognitionFailed,
  resultReset,
  historyCleared,
} = slice.actions;
export const recognitionReducer = slice.reducer;

export const selectRecognition = (state) => state.recognition;
export const selectHistory = (state) => state.recognition.history;
