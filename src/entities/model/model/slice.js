import { createSlice } from '@reduxjs/toolkit';
import { defaultWorkers } from '@/shared/api/ml';
import { DATASET_GROUPS, MIXED_FORMAT } from '@/shared/config/ml.js';
import { loadIndex } from '@/shared/lib/storage/models.js';

const library = loadIndex();

const initialState = {
  items: library.items,
  activeId: library.activeId,
  seq: library.seq,

  status: 'idle',
  phase: 'idle',
  startedAt: null,
  prep: { done: 0, total: 0 },
  train: { epoch: 0, epochs: 0, error: null },
  lossHistory: [],
  metrics: null,
  error: null,
  config: {
    groups: DATASET_GROUPS.map((g) => g.id),
    format: MIXED_FORMAT,
    variety: 'extended',
    shapes: ['circle'],
    bins: 32,
    singleBias: 0,
    imagesPerGroup: 300,
    mode: 'workers',
    workers: defaultWorkers(),
    epochs: 2000,
    learningRate: 0.3,
  },
};

const slice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    configChanged(state, { payload }) {
      Object.assign(state.config, payload);
    },
    trainingStarted(state, { payload }) {
      state.status = 'training';
      state.phase = 'prep';
      state.startedAt = payload.startedAt;
      state.prep = { done: 0, total: payload.total };
      state.train = { epoch: 0, epochs: state.config.epochs, error: null };
      state.lossHistory = [];
      state.error = null;
    },
    prepProgressed(state, { payload }) {
      state.prep = payload;
    },
    trainStarted(state) {
      state.phase = 'train';
    },
    trainingProgressed(state, { payload }) {
      state.train = payload;
      state.lossHistory.push({ epoch: payload.epoch, error: payload.error });
    },
    trainingFinished(state, { payload }) {
      state.status = 'ready';
      state.phase = 'done';
      state.metrics = payload;
      state.train.epoch = payload.epochs;
      state.train.epochs = payload.epochs;
    },
    trainingFailed(state, { payload }) {
      state.status = 'error';
      state.phase = 'idle';
      state.error = payload;
    },
    modelAdded(state, { payload }) {
      state.seq += 1;
      state.items.unshift(payload);
      state.activeId = payload.id;
    },
    modelSelected(state, { payload }) {
      if (state.items.some((item) => item.id === payload)) state.activeId = payload;
    },
    modelRenamed(state, { payload }) {
      const item = state.items.find((m) => m.id === payload.id);
      const name = payload.name.trim();
      if (item && name) item.name = name;
    },
    modelRemoved(state, { payload }) {
      state.items = state.items.filter((item) => item.id !== payload);
      if (state.activeId === payload) state.activeId = state.items[0]?.id ?? null;
    },
  },
});

export const {
  configChanged,
  trainingStarted,
  prepProgressed,
  trainStarted,
  trainingProgressed,
  trainingFinished,
  trainingFailed,
  modelAdded,
  modelSelected,
  modelRenamed,
  modelRemoved,
} = slice.actions;
export const modelReducer = slice.reducer;

export const selectModel = (state) => state.model;
export const selectModels = (state) => state.model.items;
export const selectActiveModel = (state) => state.model.items.find((m) => m.id === state.model.activeId) ?? null;
export const selectIsModelReady = (state) => selectActiveModel(state) !== null;
export const selectLibrary = (state) => ({
  items: state.model.items,
  activeId: state.model.activeId,
  seq: state.model.seq,
});
