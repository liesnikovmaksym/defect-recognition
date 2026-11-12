import { useDispatch, useSelector } from 'react-redux';
import { configChanged, selectModel } from '@/entities/model';
import { DATASET_GROUPS, FILE_FORMATS, MIXED_FORMAT, VARIETY_HINT, VARIETY_LEVELS } from '@/shared/config/ml.js';
import { SHAPE_LABELS } from '@/shared/lib/ml/shapes.js';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Field } from '@/shared/ui/Field';
import styles from './TrainForm.module.scss';

const MIN_REPRESENTATIVE = 250;

export function DatasetFields({ disabled }) {
  const dispatch = useDispatch();
  const { config } = useSelector(selectModel);
  const selected = config.groups.length;
  const all = selected === DATASET_GROUPS.length;
  const total = selected * config.imagesPerGroup;

  const toggleShape = (id) => {
    const next = config.shapes.includes(id) ? config.shapes.filter((s) => s !== id) : [...config.shapes, id];
    if (next.length) dispatch(configChanged({ shapes: next }));
  };

  const toggleGroup = (id) => {
    const next = config.groups.includes(id) ? config.groups.filter((g) => g !== id) : [...config.groups, id];
    dispatch(configChanged({ groups: next }));
  };

  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend>Набір даних (Assets)</legend>
      <Checkbox
        checked={all}
        indeterminate={selected > 0 && !all}
        onChange={() => dispatch(configChanged({ groups: all ? [] : DATASET_GROUPS.map((g) => g.id) }))}
      >
        <strong>Assets (усі групи)</strong>
      </Checkbox>
      <div className={styles.groups}>
        {DATASET_GROUPS.map((g) => (
          <Checkbox key={g.id} checked={config.groups.includes(g.id)} onChange={() => toggleGroup(g.id)}>
            {g.label} ({g.size}×{g.size})
          </Checkbox>
        ))}
      </div>
      <div className={styles.shapes} role="group" aria-label="Фігури в датасеті">
        <span className={styles.shapesLabel}>Фігури в датасеті</span>
        <div className={styles.shapeList}>
          {Object.entries(SHAPE_LABELS).map(([id, label]) => (
            <Checkbox
              key={id}
              variant="chip"
              checked={config.shapes.includes(id)}
              disabled={config.shapes.includes(id) && config.shapes.length === 1}
              onChange={() => toggleShape(id)}
            >
              {label}
            </Checkbox>
          ))}
        </div>
        {config.shapes.length > 1 && (
          <p className={styles.summary}>Змішування фігур знижує точність, краще окрема модель на одну фігуру.</p>
        )}
      </div>
      <div className={styles.row}>
        <Field label="Варіативність зображень">
          <select value={config.variety} onChange={(e) => dispatch(configChanged({ variety: e.target.value }))}>
            {VARIETY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Дефекти з одним виступом, %">
          <input
            type="number"
            min={0}
            max={100}
            step={10}
            value={Math.round(config.singleBias * 100)}
            onChange={(e) =>
              dispatch(configChanged({ singleBias: Math.min(1, Math.max(0, (Number(e.target.value) || 0) / 100)) }))
            }
          />
        </Field>
      </div>
      <p className={styles.summary}>{VARIETY_HINT}</p>
      <div className={styles.row}>
        <Field label="Формат файлів">
          <select value={config.format} onChange={(e) => dispatch(configChanged({ format: e.target.value }))}>
            <option value={MIXED_FORMAT}>Змішані (PNG + JPG + BMP)</option>
            {FILE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Зображень у кожній групі">
          <input
            type="number"
            min={10}
            max={2000}
            step={10}
            value={config.imagesPerGroup}
            onChange={(e) => dispatch(configChanged({ imagesPerGroup: Number(e.target.value) || 10 }))}
          />
        </Field>
      </div>
      <p className={`${styles.summary} ${selected === 0 || total < MIN_REPRESENTATIVE ? styles.warn : ''}`}>
        {selected === 0
          ? 'Оберіть хоча б одну групу.'
          : `Усього зображень: ${total}${total < MIN_REPRESENTATIVE ? ` (менше ${MIN_REPRESENTATIVE}: вибірка нерепрезентативна)` : ''}`}
      </p>
    </fieldset>
  );
}
