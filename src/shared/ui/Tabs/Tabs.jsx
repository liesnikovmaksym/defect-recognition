import styles from './Tabs.module.scss';

export function Tabs({ items, value, onChange, label }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === value}
          className={`${styles.tab} ${item.id === value ? styles.active : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
