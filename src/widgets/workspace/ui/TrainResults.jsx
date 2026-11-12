import { useSelector } from 'react-redux';
import { LossChart, ModelMetrics, selectModel } from '@/entities/model';
import { Placeholder } from '@/shared/ui/Placeholder';

export function TrainResults() {
  const { metrics, lossHistory, train } = useSelector(selectModel);
  return (
    <>
      {lossHistory.length > 1 && <LossChart history={lossHistory} epochs={train.epochs} />}
      {metrics ? (
        <ModelMetrics metrics={metrics} />
      ) : (
        <Placeholder title="Метрики моделі" hint="Точність, час і матриця помилок з'являться після навчання" minHeight={110} />
      )}
    </>
  );
}
