import { createSlice } from '@reduxjs/toolkit';
import { clearImage, loadImageFile } from './thunks.js';

const initialState = {
  status: 'idle',
  previewUrl: null,
  meta: null,
  error: null,
};

const slice = createSlice({
  name: 'image',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadImageFile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadImageFile.fulfilled, (state, { payload }) => {
        state.status = 'ready';
        state.previewUrl = payload.previewUrl;
        state.meta = payload.meta;
      })
      .addCase(loadImageFile.rejected, (state, { error }) => {
        state.status = state.meta ? 'ready' : 'error';
        state.error = error.message;
      })
      .addCase(clearImage.fulfilled, () => initialState);
  },
});

export const imageReducer = slice.reducer;

export const selectImage = (state) => state.image;
