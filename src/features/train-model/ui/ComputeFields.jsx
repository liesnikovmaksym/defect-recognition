import { useDispatch, useSelector } from 'react-redux';
import { configChanged, selectModel } from '@/entities/model';
import { maxWorkers } from '@/shared/api/ml';
import { Field } from '@/shared/ui/Field';
import styles from './TrainForm.module.scss';

export function ComputeFields({ disabled }) {
  const dispatch = useDispatch();
  const { config } = useSelector(selectModel);
  const cores = maxWorkers();

  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend>Обчислення та розпаралелення</legend>
      <div className={styles.row}>
        <Field label="Підготовка зображень">
          <select value={config.mode} onChange={(e) => dispatch(configChanged({ mode: e.target.value }))}>
            <option value="workers">Пул Web Workers</option>
            <option value="main">Головний потік</option>
          </select>
        </Field>
        <Field label={`Кількість воркерів (ядер: ${cores})`}>
          <input
            type="number"
            min={1}
            max={cores}
            value={config.workers}
            disabled={config.mode === 'main'}
            onChange={(e) => dispatch(configChanged({ workers: Math.min(cores, Math.max(1, Number(e.target.value) || 1)) }))}
          />
        </Field>
      </div>
    </fieldset>
  );
}
