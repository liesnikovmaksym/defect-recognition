import { useSelector } from 'react-redux';
import { CumulativeChart, ResultCard, selectRecognition } from '@/entities/recognition';
import { SaveResultButtons } from '@/features/export-results';
import { Card } from '@/shared/ui/Card';
import { Placeholder } from '@/shared/ui/Placeholder';
import styles from './ResultPanel.module.scss';

export function ResultPanel() {
  const { result } = useSelector(selectRecognition);

  return (
    <Card title="Результат розпізнавання">
      {result ? (
        <>
          <div className={styles.grid}>
            <ResultCard result={result} />
            <CumulativeChart values={result.cumulative} />
          </div>
          <SaveResultButtons />
        </>
      ) : (
        <div className={styles.grid}>
          <Placeholder title="Вердикт мережі" hint="Є дефект чи ні, та впевненість" minHeight={140} />
          <Placeholder title="Кумулятивна гістограма" hint="Ознаки, які отримала мережа" minHeight={140} />
        </div>
      )}
    </Card>
  );
}
