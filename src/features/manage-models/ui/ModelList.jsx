import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectModel } from '@/entities/model';
import { formatMs, formatPercent } from '@/shared/lib/format.js';
import { Button } from '@/shared/ui/Button';
import { Placeholder } from '@/shared/ui/Placeholder';
import { deleteModel, renameModel, selectModelById } from '../model/actions.js';
import styles from './ModelList.module.scss';

function ModelItem({ item, active, busy }) {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [confirming, setConfirming] = useState(false);
  const { config, metrics } = item;

  const commitRename = () => {
    dispatch(renameModel(item.id, name));
    setEditing(false);
  };

  return (
    <li className={`${styles.item} ${active ? styles.active : ''}`}>
      <div className={styles.head}>
        {editing ? (
          <input
            className={styles.input}
            value={name}
            autoFocus
            aria-label="Нова назва моделі"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <strong className={styles.name}>{item.name}</strong>
        )}
        {active && <span className={styles.badge}>Використовується</span>}
      </div>
      <p className={styles.meta}>
        {new Date(item.createdAt).toLocaleString('uk-UA', { hour12: false })} · точність {formatPercent(metrics.accuracy)}
      </p>
      <p className={styles.meta}>
        {metrics.imageCount} зображень, {metrics.epochs} епох, швидкість {config.learningRate}, навчання {formatMs(metrics.trainMs)}
      </p>
      <div className={styles.actions}>
        {editing ? (
          <>
            <Button onClick={commitRename} disabled={!name.trim()}>Зберегти назву</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>Скасувати</Button>
          </>
        ) : confirming ? (
          <>
            <Button onClick={() => dispatch(deleteModel(item.id))}>Підтвердити видалення</Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>Скасувати</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" disabled={active || busy} onClick={() => dispatch(selectModelById(item.id))}>
              Обрати
            </Button>
            <Button variant="secondary" onClick={() => { setName(item.name); setEditing(true); }}>
              Перейменувати
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setConfirming(true)}>
              Видалити
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

export function ModelList() {
  const { items, activeId, status } = useSelector(selectModel);
  const busy = status === 'training';

  return (
    <div className={styles.root}>
      {items.length ? (
        <ul className={styles.list}>
          {items.map((item) => (
            <ModelItem key={item.id} item={item} active={item.id === activeId} busy={busy} />
          ))}
        </ul>
      ) : (
        <Placeholder title="Збережених моделей немає" hint="Після навчання модель з'явиться тут і збережеться у браузері" minHeight={100} />
      )}
    </div>
  );
}
