import styles from './Card.module.scss';

export function Card({ title, step, actions, children }) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {step && <span className={styles.step}>{step}</span>}
          {title}
        </h2>
        {actions}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
