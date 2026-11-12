import { useDispatch, useSelector } from 'react-redux';
import { HistoryList, historyCleared, selectHistory } from '@/entities/recognition';
import { Button } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer';
import { Placeholder } from '@/shared/ui/Placeholder';

export function HistoryPanel({ open, onClose }) {
  const dispatch = useDispatch();
  const history = useSelector(selectHistory);

  const clear = () => {
    history.forEach(({ url, thumbUrl }) => {
      URL.revokeObjectURL(url);
      if (thumbUrl !== url) URL.revokeObjectURL(thumbUrl);
    });
    dispatch(historyCleared());
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      storageKey="defect-recognition:history-width:v2"
      label="Історія"
      actions={
        <Button variant="secondary" onClick={clear} disabled={!history.length}>
          Очистити історію
        </Button>
      }
    >
      {history.length ? (
        <HistoryList history={history} />
      ) : (
        <Placeholder title="Історія порожня" hint="Кожне розпізнавання з'явиться тут: зображення, вердикт, модель і час" minHeight={120} />
      )}
    </Drawer>
  );
}
