import { useSelector } from 'react-redux';
import { selectModels } from '@/entities/model';
import { ModelList } from '@/features/manage-models';
import { Card } from '@/shared/ui/Card';
import { Tabs } from '@/shared/ui/Tabs';
import { RecognizeView } from './RecognizeView.jsx';
import { TrainResults } from './TrainResults.jsx';
import { TrainView } from './TrainView.jsx';

export const WORKSPACE_VIEWS = [
  { id: 'recognize', label: 'Розпізнавання' },
  { id: 'train', label: 'Навчання моделі' },
];

const TITLES = { recognize: 'Зображення', train: 'Навчання нейромережі' };

export function Workspace({ view, onViewChange }) {
  const modelCount = useSelector(selectModels).length;

  return (
    <>
      <Card
        title={TITLES[view]}
        actions={<Tabs label="Режим роботи" items={WORKSPACE_VIEWS} value={view} onChange={onViewChange} />}
      >
        {view === 'recognize' ? <RecognizeView /> : <TrainView />}
      </Card>
      {view === 'train' && (
        <>
          <Card title="Результати навчання">
            <TrainResults />
          </Card>
          <Card title={`Збережені моделі (${modelCount})`}>
            <ModelList />
          </Card>
        </>
      )}
    </>
  );
}
