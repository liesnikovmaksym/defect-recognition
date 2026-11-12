import { logAdded } from '@/entities/log';
import { modelRemoved, modelRenamed, modelSelected } from '@/entities/model';
import { removePayload } from '@/shared/lib/storage/models.js';

const nameOf = (getState, id) => getState().model.items.find((m) => m.id === id)?.name ?? id;

export const selectModelById = (id) => (dispatch, getState) => {
  dispatch(modelSelected(id));
  dispatch(logAdded(`Обрано модель «${nameOf(getState, id)}»`));
};

export const renameModel = (id, name) => (dispatch, getState) => {
  const old = nameOf(getState, id);
  dispatch(modelRenamed({ id, name }));
  dispatch(logAdded(`Модель «${old}» перейменовано на «${nameOf(getState, id)}»`));
};

export const deleteModel = (id) => (dispatch, getState) => {
  const name = nameOf(getState, id);
  removePayload(id);
  dispatch(modelRemoved(id));
  dispatch(logAdded(`Модель «${name}» видалено`, 'warn'));
};
