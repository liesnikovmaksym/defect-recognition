import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadImageFile } from '@/entities/image';
import { logAdded } from '@/entities/log';
import { formatBytes, formatMs } from '@/shared/lib/format.js';
import { SAMPLE_RESOLUTIONS, generateSampleFile } from '@/shared/lib/image/generate.js';
import { SHAPE_LABELS } from '@/shared/lib/ml/shapes.js';
import { Button } from '@/shared/ui/Button';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Field } from '@/shared/ui/Field';
import styles from './SampleGenerator.module.scss';

export function SampleGenerator() {
  const dispatch = useDispatch();
  const [type, setType] = useState('circle');
  const [defective, setDefective] = useState('false');
  const [resolution, setResolution] = useState(256);
  const [invert, setInvert] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastMs, setLastMs] = useState(null);

  const generate = async () => {
    setBusy(true);
    const started = performance.now();
    try {
      const file = await generateSampleFile({ type, defective: defective === 'true', resolution, invert });
      await dispatch(loadImageFile({ file, source: 'generated' }));
      const ms = performance.now() - started;
      setLastMs(ms);
      dispatch(logAdded(`Згенеровано ${file.name} (${formatBytes(file.size)}) за ${formatMs(ms)}`, 'success'));
    } catch (error) {
      dispatch(logAdded(`Помилка генерації: ${error.message}`, 'error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.fields}>
        <Field label="Фігура">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(SHAPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Дефект">
          <select value={defective} onChange={(e) => setDefective(e.target.value)}>
            <option value="false">Без дефекту</option>
            <option value="true">Зі зайвими виступами</option>
          </select>
        </Field>
        <Field label="Роздільність">
          <select value={resolution} onChange={(e) => setResolution(Number(e.target.value))}>
            {SAMPLE_RESOLUTIONS.map((r) => (
              <option key={r} value={r}>
                {r}×{r}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Checkbox checked={invert} onChange={(e) => setInvert(e.target.checked)}>
        Темна фігура на світлому фоні
      </Checkbox>
      <Button variant="secondary" onClick={generate} disabled={busy}>
        {busy ? 'Генерація…' : 'Згенерувати тестове зображення'}
      </Button>
      {lastMs != null && <p className={styles.time}>Час генерації: {formatMs(lastMs)}</p>}
    </div>
  );
}
