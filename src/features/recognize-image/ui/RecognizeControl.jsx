import { useDispatch, useSelector } from 'react-redux';
import { selectImage } from '@/entities/image';
import { selectIsModelReady } from '@/entities/model';
import { selectRecognition } from '@/entities/recognition';
import { RECOGNITION_STEPS } from '@/shared/config/ml.js';
import { Button } from '@/shared/ui/Button';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { recognizeImage } from '../model/recognizeImage.js';
import styles from './RecognizeControl.module.scss';

export function RecognizeControl() {
  const dispatch = useDispatch();
  const modelReady = useSelector(selectIsModelReady);
  const { meta } = useSelector(selectImage);
  const { status, stage, progress, error } = useSelector(selectRecognition);
  const running = status === 'running';
  const done = status === 'done';

  let hint = '';
  if (!modelReady) hint = 'Немає моделі: навчіть її на вкладці «Навчання моделі».';
  else if (!meta) hint = 'Завантажте або згенеруйте зображення.';

  const current = RECOGNITION_STEPS.findIndex((s) => s.stage === stage);
  const total = RECOGNITION_STEPS.length;
  let label = '';
  if (running || done) label = current >= 0 ? `Крок ${current + 1} з ${total}: ${stage}` : stage;

  return (
    <div className={styles.root}>
      <Button onClick={() => dispatch(recognizeImage())} disabled={!modelReady || !meta || running}>
        {running ? 'Розпізнавання…' : 'Розпізнати дефекти'}
      </Button>
      {hint && <p className={styles.hint}>{hint}</p>}
      <ProgressBar value={progress} label={label} idleLabel="Розпізнавання не запускалось" />
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
