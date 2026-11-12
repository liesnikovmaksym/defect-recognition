import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectModel } from '@/entities/model';
import { formatMs } from '@/shared/lib/format.js';
import styles from './TrainForm.module.scss';

export function Elapsed() {
  const { status, startedAt, metrics } = useSelector(selectModel);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status !== 'training') return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [status]);

  if (status === 'training') {
    return <p className={styles.timer}>Минуло часу: <strong>{formatMs(Math.max(0, now - startedAt))}</strong></p>;
  }
  if (metrics) {
    return <p className={styles.timer}>Загальний час останнього навчання: <strong>{formatMs(metrics.totalMs)}</strong></p>;
  }
  return <p className={styles.timer}>Час виконання з'явиться після запуску навчання.</p>;
}
