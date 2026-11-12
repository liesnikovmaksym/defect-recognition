import { useDispatch, useSelector } from 'react-redux';
import { selectModel } from '@/entities/model';
import { formatPercent } from '@/shared/lib/format.js';
import { Field } from '@/shared/ui/Field';
import { selectModelById } from '../model/actions.js';

export function ModelSelect() {
  const dispatch = useDispatch();
  const { items, activeId, status } = useSelector(selectModel);

  return (
    <Field label="Модель для розпізнавання">
      <select
        value={activeId ?? ''}
        disabled={!items.length || status === 'training'}
        onChange={(e) => dispatch(selectModelById(e.target.value))}
      >
        {!items.length && <option value="">Немає збережених моделей</option>}
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} (точність {formatPercent(item.metrics.accuracy)})
          </option>
        ))}
      </select>
    </Field>
  );
}
