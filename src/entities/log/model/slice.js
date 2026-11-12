import { createSlice } from '@reduxjs/toolkit';

const MAX_ENTRIES = 500;
let seq = 0;

const slice = createSlice({
  name: 'log',
  initialState: { entries: [] },
  reducers: {
    logAdded: {
      reducer(state, { payload }) {
        state.entries.push(payload);
        if (state.entries.length > MAX_ENTRIES) state.entries.shift();
      },
      prepare(message, level = 'info') {
        seq += 1;
        return { payload: { id: seq, time: new Date().toISOString(), level, message } };
      },
    },
    logCleared(state) {
      state.entries = [];
    },
  },
});

export const { logAdded, logCleared } = slice.actions;
export const logReducer = slice.reducer;

export const selectLogEntries = (state) => state.log.entries;
