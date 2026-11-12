import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectImage } from '@/entities/image';
import { DrawCanvas } from '@/features/draw-shape';
import { SampleGenerator } from '@/features/generate-sample';
import { ModelSelect } from '@/features/manage-models';
import { RecognizeControl } from '@/features/recognize-image';
import { ImageUploader } from '@/features/upload-image';
import { Tabs } from '@/shared/ui/Tabs';
import { ImagePreview } from './ImagePreview.jsx';
import styles from './RecognizeView.module.scss';

const SOURCES = [
  { id: 'upload', label: 'Файл' },
  { id: 'draw', label: 'Малювання' },
];

export function RecognizeView() {
  const { meta } = useSelector(selectImage);
  const [source, setSource] = useState('upload');

  return (
    <>
      {meta ? (
        <ImagePreview />
      ) : (
        <>
          <Tabs label="Джерело зображення" items={SOURCES} value={source} onChange={setSource} />
          {source === 'upload' ? <ImageUploader /> : <DrawCanvas />}
        </>
      )}
      <ModelSelect />
      <RecognizeControl />
      <details className={styles.generator}>
        <summary>Немає файлу? Згенерувати тестове зображення</summary>
        <SampleGenerator />
      </details>
    </>
  );
}
