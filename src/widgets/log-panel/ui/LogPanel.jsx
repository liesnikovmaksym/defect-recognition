import { useDispatch, useSelector } from 'react-redux';
import { LogList, logCleared, logToText, selectLogEntries } from '@/entities/log';
import { downloadBlob } from '@/shared/lib/image/export.js';
import { Button } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer';
import { Placeholder } from '@/shared/ui/Placeholder';

export function LogPanel({ open, onClose }) {
  const dispatch = useDispatch();
  const entries = useSelector(selectLogEntries);

  const save = () => {
    const name = `log-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.txt`;
    downloadBlob(new Blob([logToText(entries)], { type: 'text/plain;charset=utf-8' }), name);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      storageKey="defect-recognition:log-width:v2"
      label="Лог операцій"
      actions={
        <>
          <Button variant="secondary" onClick={save} disabled={!entries.length}>
            Зберегти у файл
          </Button>
          <Button variant="secondary" onClick={() => dispatch(logCleared())} disabled={!entries.length}>
            Очистити
          </Button>
        </>
      }
    >
      {entries.length ? (
        <LogList entries={entries} />
      ) : (
        <Placeholder title="Лог порожній" hint="Тут з'являтимуться записи про завантаження, навчання, розпізнавання й збереження" minHeight={120} />
      )}
    </Drawer>
  );
}
