import styles from './Field.module.scss';

export function Field({ label, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}
