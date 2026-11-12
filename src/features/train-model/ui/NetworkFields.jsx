import { useDispatch, useSelector } from 'react-redux';
import { configChanged, selectModel } from '@/entities/model';
import { Field } from '@/shared/ui/Field';
import styles from './TrainForm.module.scss';

const FIELDS = [
  { key: 'epochs', label: 'Кількість епох', min: 100, max: 20000, step: 100 },
  { key: 'learningRate', label: 'Швидкість навчання', min: 0.01, max: 1, step: 0.05 },
];

export function NetworkFields({ disabled }) {
  const dispatch = useDispatch();
  const { config } = useSelector(selectModel);

  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend>Параметри мережі</legend>
      <div className={styles.row}>
        {FIELDS.map(({ key, label, ...range }) => (
          <Field key={key} label={label}>
            <input
              type="number"
              {...range}
              value={config[key]}
              onChange={(e) => dispatch(configChanged({ [key]: Number(e.target.value) }))}
            />
          </Field>
        ))}
      </div>
      <p className={styles.summary}>
        Еталон: фігура без дефектів по центру, радіус 30%. Зображення мають бути вирівняні з ним, кнопка «Круг» на
        полотні дає саме таку фігуру.
      </p>
    </fieldset>
  );
}
