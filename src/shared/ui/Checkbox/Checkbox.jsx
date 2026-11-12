import { useEffect, useRef } from 'react';
import styles from './Checkbox.module.scss';

export function Checkbox({ checked, onChange, disabled, indeterminate = false, variant = 'box', children, ...rest }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={`${styles.root} ${variant === 'chip' ? styles.chip : ''}`}>
      <input
        ref={inputRef}
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        {...rest}
      />
      <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true">
        <rect className={styles.frame} x="1" y="1" width="18" height="18" rx={variant === 'chip' ? 9 : 4} />
        <path className={styles.tick} d="M5.5 10.5l3 3 6-7" />
        <path className={styles.dash} d="M6 10h8" />
      </svg>
      <span className={styles.label}>{children}</span>
    </label>
  );
}
