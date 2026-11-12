import styles from './Button.module.scss';

export function Button({ variant = 'primary', icon, children, className = '', ...rest }) {
  return (
    <button type="button" className={`${styles.button} ${styles[variant]} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}
