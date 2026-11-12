import { useSelector } from 'react-redux';
import { selectLogEntries } from '@/entities/log';
import { selectHistory } from '@/entities/recognition';
import styles from './Navbar.module.scss';

const PANELS = [
  { id: 'history', label: 'Історія' },
  { id: 'log', label: 'Логи' },
];

export function Navbar({ panel, onTogglePanel }) {
  const counts = {
    history: useSelector(selectHistory).length,
    log: useSelector(selectLogEntries).length,
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <span className={styles.brand}>Розпізнавання дефектів фігур</span>
        <nav className={styles.nav} aria-label="Панелі">
          {PANELS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`${styles.link} ${panel === id ? styles.active : ''}`}
              aria-pressed={panel === id}
              onClick={() => onTogglePanel(id)}
            >
              {label}
              {counts[id] > 0 && <span className={styles.badge}>{counts[id]}</span>}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
