import { formatMs, formatPercent } from '@/shared/lib/format.js';
import styles from './ResultCard.module.scss';

const LABELS = {
  normal: 'Дефектів не виявлено',
  defect: 'Виявлено дефект (зайві виступи)',
};

export function ResultCard({ result }) {
  const isDefect = result.label === 'defect';
  return (
    <div className={`${styles.card} ${isDefect ? styles.bad : styles.good}`}>
      <p className={styles.verdict}>{LABELS[result.label]}</p>
      <p className={styles.confidence}>Впевненість мережі: {formatPercent(result.scores[result.label])}</p>
      {result.modelName && <p className={styles.confidence}>Модель: {result.modelName}</p>}
      <div className={styles.scores}>
        {Object.entries(LABELS).map(([key, text]) => (
          <div key={key} className={styles.score}>
            <span>{key === 'normal' ? 'Без дефекту' : 'Дефект'}</span>
            <div className={styles.bar}>
              <div style={{ width: `${Math.round(result.scores[key] * 100)}%` }} />
            </div>
            <span>{formatPercent(result.scores[key])}</span>
          </div>
        ))}
      </div>
      <p className={styles.timing}>
        Час розпізнавання: <strong>{formatMs(result.totalMs)}</strong> (декодування та масштабування{' '}
        {formatMs(result.steps.decode)}, гістограма {formatMs(result.steps.histogram)}, мережа{' '}
        {formatMs(result.steps.predict)})
      </p>
    </div>
  );
}
