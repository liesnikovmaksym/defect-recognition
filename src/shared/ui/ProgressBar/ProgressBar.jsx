import styles from './ProgressBar.module.scss';

export function ProgressBar({ value, label, idleLabel = 'Очікування' }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={styles.wrapper}>
      <div className={styles.caption}>
        <span>{label || idleLabel}</span>
        <span>{percent}%</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label || idleLabel}
      >
        <div className={styles.fill} style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
    </div>
  );
}
