import { useEffect } from 'react';
import styles from './Lightbox.module.scss';

export function Lightbox({ src, caption, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={caption} onClick={onClose}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Закрити перегляд">
        ×
      </button>
      <img src={src} alt={caption} className={styles.image} onClick={(e) => e.stopPropagation()} />
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
