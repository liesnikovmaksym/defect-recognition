import { useEffect, useId, useRef, useState } from 'react';
import styles from './InfoPopover.module.scss';

function InfoIcon() {
  return (
    <svg viewBox="0 0 512 512" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
    </svg>
  );
}

export function InfoPopover({ label = 'Інформація', disabled, children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <InfoIcon />
      </button>
      {open && (
        <div id={panelId} className={styles.panel} role="dialog" aria-label={label}>
          {children}
        </div>
      )}
    </div>
  );
}
