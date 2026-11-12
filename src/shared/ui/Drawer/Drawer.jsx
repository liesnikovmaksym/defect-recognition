import { useCallback, useEffect, useState } from 'react';
import { Button } from '../Button';
import styles from './Drawer.module.scss';

const MIN_WIDTH = 280;
const DEFAULT_WIDTH = 500;
const KEY_STEP = 24;

const viewportWidth = () => document.documentElement.clientWidth;
const clamp = (value) => Math.min(viewportWidth(), Math.max(MIN_WIDTH, value));

function readWidth(key) {
  try {
    return Number(localStorage.getItem(key)) || DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

export function Drawer({ open, onClose, storageKey, label, actions, children }) {
  const [width, setWidth] = useState(() => readWidth(storageKey));
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(Math.round(width)));
    } catch {
    }
  }, [storageKey, width]);

  const onPointerDown = useCallback((event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
  }, []);
  const onPointerMove = useCallback(
    (event) => {
      if (resizing) setWidth(clamp(viewportWidth() - event.clientX));
    },
    [resizing],
  );
  const stopResizing = useCallback(() => setResizing(false), []);
  const onHandleKey = (event) => {
    if (event.key === 'ArrowLeft') setWidth((w) => clamp(w + KEY_STEP));
    if (event.key === 'ArrowRight') setWidth((w) => clamp(w - KEY_STEP));
  };

  return (
    <aside
      className={`${styles.drawer} ${open ? styles.open : ''} ${resizing ? styles.resizing : ''}`}
      style={{ width }}
      aria-label={label}
      aria-hidden={!open}
    >
      <div
        className={styles.handle}
        role="separator"
        aria-orientation="vertical"
        aria-label="Змінити ширину панелі"
        aria-valuemin={MIN_WIDTH}
        aria-valuenow={Math.round(width)}
        tabIndex={open ? 0 : -1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopResizing}
        onPointerCancel={stopResizing}
        onKeyDown={onHandleKey}
      />
      <div className={styles.bar}>
        {actions}
        <Button variant="secondary" className={styles.close} onClick={onClose} aria-label="Закрити панель">
          Закрити
        </Button>
      </div>
      {children}
    </aside>
  );
}
