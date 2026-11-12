import { DATASET_GROUPS } from '@/shared/config/ml.js';
import { formatMs, formatPercent } from '@/shared/lib/format.js';
import styles from './ModelMetrics.module.scss';

const groupLabel = (id) => {
  const g = DATASET_GROUPS.find((item) => item.id === id);
  return g ? `${g.label} ${g.size}×${g.size}` : id;
};

export function ModelMetrics({ metrics }) {
  const { confusion } = metrics;
  return (
    <div className={styles.root}>
      <div className={styles.stats}>
        <div>
          <span className={styles.value}>{formatPercent(metrics.accuracy)}</span>
          <span className={styles.caption}>точність на тесті</span>
        </div>
        <div>
          <span className={styles.value}>{metrics.trainError.toFixed(4)}</span>
          <span className={styles.caption}>помилка навчання</span>
        </div>
        <div>
          <span className={styles.value}>{formatMs(metrics.prepMs)}</span>
          <span className={styles.caption}>підготовка {metrics.imageCount} зобр.</span>
        </div>
        <div>
          <span className={styles.value}>{formatMs(metrics.trainMs)}</span>
          <span className={styles.caption}>навчання, {metrics.epochs} епох</span>
        </div>
      </div>
      <p className={styles.note}>
        Разом: {formatMs(metrics.totalMs)}. Навчальна вибірка: {metrics.trainSize}, тестова: {metrics.testSize}. Підготовка:{' '}
        {metrics.workers === 0 ? 'головний потік' : `Web Workers × ${metrics.workers}`}.
      </p>
      <table className={styles.table}>
        <caption>Матриця помилок (рядок — справжній клас, стовпець — передбачений)</caption>
        <thead>
          <tr>
            <th />
            <th>Без дефекту</th>
            <th>Дефект</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Без дефекту</th>
            <td>{confusion.normal.normal}</td>
            <td>{confusion.normal.defect}</td>
          </tr>
          <tr>
            <th>Дефект</th>
            <td>{confusion.defect.normal}</td>
            <td>{confusion.defect.defect}</td>
          </tr>
        </tbody>
      </table>
      <table className={styles.table}>
        <caption>Точність на тесті за групами якості та форматами файлів</caption>
        <tbody>
          {Object.entries(metrics.byGroup).map(([id, v]) => (
            <tr key={id}>
              <th>{groupLabel(id)}</th>
              <td>{formatPercent(v.correct / v.total)} ({v.correct}/{v.total})</td>
            </tr>
          ))}
          {Object.entries(metrics.byFormat).map(([id, v]) => (
            <tr key={id}>
              <th>{id.toUpperCase()}</th>
              <td>{formatPercent(v.correct / v.total)} ({v.correct}/{v.total})</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
