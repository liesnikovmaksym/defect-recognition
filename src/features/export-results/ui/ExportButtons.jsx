import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectImage } from '@/entities/image';
import { logAdded } from '@/entities/log';
import { selectRecognition } from '@/entities/recognition';
import { downloadBlob } from '@/shared/lib/image/export.js';
import { Button } from '@/shared/ui/Button';
import { encodeResultXlsx } from '../model/resultXlsx.js';
import styles from './ExportButtons.module.scss';

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

export function SaveResultButtons() {
  const dispatch = useDispatch();
  const { result } = useSelector(selectRecognition);
  const { meta } = useSelector(selectImage);
  const [busy, setBusy] = useState(false);

  const saveExcel = async () => {
    setBusy(true);
    try {
      const blob = await encodeResultXlsx({ image: meta, result });
      const name = `result-${stamp()}.xlsx`;
      downloadBlob(blob, name);
      dispatch(logAdded(`Результат збережено: ${name}`, 'success'));
    } catch (error) {
      dispatch(logAdded(`Помилка збереження результату: ${error.message}`, 'error'));
    } finally {
      setBusy(false);
    }
  };

  const saveJson = () => {
    const payload = {
      savedAt: new Date().toISOString(),
      image: meta,
      model: result.modelName,
      verdict: result.label === 'defect' ? 'Виявлено дефект' : 'Дефектів не виявлено',
      scores: result.scores,
      timingMs: { total: result.totalMs, ...result.steps },
      cumulativeHistogram: result.cumulative,
    };
    const name = `result-${stamp()}.json`;
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), name);
    dispatch(logAdded(`Результат збережено: ${name}`, 'success'));
  };

  return (
    <div className={styles.row}>
      <Button variant="secondary" className={styles.button} onClick={saveExcel} disabled={!result || busy}>
        {busy ? 'Збереження…' : 'Зберегти результат (Excel)'}
      </Button>
      <Button variant="secondary" className={styles.button} onClick={saveJson} disabled={!result}>
        Зберегти результат (JSON)
      </Button>
    </div>
  );
}
