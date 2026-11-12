import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectImage } from '@/entities/image';
import { logAdded } from '@/entities/log';
import { formatBytes } from '@/shared/lib/format.js';
import { EXPORT_FORMATS, convertImage, downloadBlob } from '@/shared/lib/image/export.js';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import styles from './SaveImageControl.module.scss';

export function SaveImageControl() {
  const dispatch = useDispatch();
  const { meta, previewUrl } = useSelector(selectImage);
  const [format, setFormat] = useState('png');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const blob = await convertImage(previewUrl, format);
      const base = meta.name.replace(/\.[^.]+$/, '');
      downloadBlob(blob, `${base}.${format}`);
      dispatch(logAdded(`Зображення збережено: ${base}.${format} (${formatBytes(blob.size)})`, 'success'));
    } catch (e) {
      setError(e.message);
      dispatch(logAdded(`Помилка збереження: ${e.message}`, 'error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.root}>
      <Field label="Формат збереження">
        <select value={format} onChange={(e) => setFormat(e.target.value)} disabled={!meta}>
          {EXPORT_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </Field>
      <Button variant="secondary" className={styles.save} onClick={save} disabled={!meta || busy}>
        {busy ? 'Збереження…' : 'Зберегти зображення'}
      </Button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
