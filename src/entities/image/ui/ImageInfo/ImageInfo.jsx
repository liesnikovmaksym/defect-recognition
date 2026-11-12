import { formatBytes } from '@/shared/lib/format.js';
import { sourceLabel } from '../../lib/source.js';
import styles from './ImageInfo.module.scss';

export function ImageInfo({ meta }) {
  const rows = [
    ['Назва файлу', meta.name],
    ['Розширення', meta.extension ? `.${meta.extension}` : '—'],
    ['MIME-тип', meta.type],
    ['Розмір файлу', `${formatBytes(meta.size)} (${meta.size.toLocaleString('uk-UA')} Б)`],
    ['Роздільність', `${meta.width} × ${meta.height} px`],
    ['Мегапікселі', `${((meta.width * meta.height) / 1e6).toFixed(2)} Мп`],
    ['Джерело', sourceLabel(meta.source)],
    ['Змінено', new Date(meta.lastModified).toLocaleString('uk-UA')],
  ];
  return (
    <dl className={styles.list}>
      {rows.map(([term, value]) => (
        <div key={term} className={styles.row}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
