import { useState } from 'react';
import { formatBytes, formatMs, formatPercent } from '@/shared/lib/format.js';
import { Lightbox } from '@/shared/ui/Lightbox';
import styles from './HistoryList.module.scss';

export function HistoryList({ history }) {
  const [zoomed, setZoomed] = useState(null);

  return (
    <>
      <ol className={styles.list} aria-label="Історія">
        {history.map((entry, index) => {
          const defect = entry.label === 'defect';
          return (
            <li key={entry.id} className={`${styles.item} ${defect ? styles.bad : styles.good}`}>
              <button
                type="button"
                className={styles.thumb}
                onClick={() => setZoomed(entry)}
                aria-label={`Відкрити на весь екран: ${entry.name}`}
                title="Відкрити на весь екран"
              >
                <img src={entry.thumbUrl} alt={entry.name} />
              </button>
              <div className={styles.info}>
                <div className={styles.head}>
                  <span className={styles.index}>{history.length - index}</span>
                  <strong className={styles.name} title={entry.name}>{entry.name}</strong>
                </div>
                <p className={styles.verdict}>
                  {defect ? 'Виявлено дефект' : 'Дефектів не виявлено'} ({formatPercent(entry.confidence)})
                </p>
                <p className={styles.meta}>
                  {new Date(entry.time).toLocaleTimeString('uk-UA', { hour12: false })} · модель «{entry.modelName}» ·{' '}
                  {formatBytes(entry.size)} · {entry.width}×{entry.height} · {formatMs(entry.totalMs)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {zoomed && <Lightbox src={zoomed.url} caption={zoomed.name} onClose={() => setZoomed(null)} />}
    </>
  );
}
