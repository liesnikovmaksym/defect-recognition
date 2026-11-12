import styles from './Placeholder.module.scss';

export function Placeholder({ title, hint, minHeight = 160 }) {
  return (
    <div className={styles.placeholder} style={{ minHeight }}>
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
    </div>
  );
}
