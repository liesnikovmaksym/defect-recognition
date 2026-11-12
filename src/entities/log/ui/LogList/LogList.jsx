import { useEffect, useRef } from 'react';
import { formatLogLine } from '../../lib/format.js';
import styles from './LogList.module.scss';

export function LogList({ entries }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries.length]);

  return (
    <ol className={styles.list} ref={ref} aria-label="Лог операцій" aria-live="polite">
      {entries.map((entry) => (
        <li key={entry.id} className={`${styles.line} ${styles[entry.level]}`}>
          {formatLogLine(entry)}
        </li>
      ))}
    </ol>
  );
}
