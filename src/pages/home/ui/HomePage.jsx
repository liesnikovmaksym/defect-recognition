import { useCallback, useState } from 'react';
import { HistoryPanel } from '@/widgets/history-panel';
import { LogPanel } from '@/widgets/log-panel';
import { Navbar } from '@/widgets/navbar';
import { ResultPanel } from '@/widgets/result-panel';
import { Workspace } from '@/widgets/workspace';
import styles from './HomePage.module.scss';

export function HomePage() {
  const [view, setView] = useState('recognize');
  const [panel, setPanel] = useState(null);
  const toggle = useCallback((id) => setPanel((current) => (current === id ? null : id)), []);
  const close = useCallback(() => setPanel(null), []);

  return (
    <>
      <Navbar panel={panel} onTogglePanel={toggle} />
      <main className={styles.page}>
        <Workspace view={view} onViewChange={setView} />
        {view === 'recognize' && <ResultPanel />}
      </main>
      <HistoryPanel open={panel === 'history'} onClose={close} />
      <LogPanel open={panel === 'log'} onClose={close} />
    </>
  );
}
