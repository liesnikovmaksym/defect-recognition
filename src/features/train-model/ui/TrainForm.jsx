import { useDispatch, useSelector } from 'react-redux';
import { selectModel } from '@/entities/model';
import { Button } from '@/shared/ui/Button';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { trainModel } from '../model/trainModel.js';
import { ComputeFields } from './ComputeFields.jsx';
import { DatasetFields } from './DatasetFields.jsx';
import { Elapsed } from './Elapsed.jsx';
import { NetworkFields } from './NetworkFields.jsx';
import styles from './TrainForm.module.scss';

export function TrainForm() {
  const dispatch = useDispatch();
  const { status, phase, prep, train, error, config } = useSelector(selectModel);
  const training = status === 'training';
  const hasStarted = status !== 'idle';

  const prepLabel = hasStarted ? `Підготовка зображень: ${prep.done} / ${prep.total}` : '';
  const trainLabel =
    phase === 'train' || phase === 'done'
      ? `Навчання: епоха ${train.epoch} / ${train.epochs}${train.error != null ? `, помилка ${train.error.toFixed(4)}` : ''}`
      : '';

  return (
    <div className={styles.root}>
      <DatasetFields disabled={training} />
      <ComputeFields disabled={training} />
      <NetworkFields disabled={training} />
      <Button onClick={() => dispatch(trainModel())} disabled={training || config.groups.length === 0}>
        {training ? 'Навчання…' : status === 'ready' ? 'Навчити заново' : 'Навчити мережу'}
      </Button>
      <div className={styles.bars}>
        <ProgressBar
          value={prep.total ? prep.done / prep.total : 0}
          label={prepLabel}
          idleLabel="Підготовка зображень: не запускалась"
        />
        <ProgressBar
          value={train.epochs ? train.epoch / train.epochs : 0}
          label={trainLabel}
          idleLabel="Навчання (епохи): не запускалось"
        />
      </div>
      <Elapsed />
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
