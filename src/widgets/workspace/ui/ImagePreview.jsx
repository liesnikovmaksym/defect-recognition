import { useDispatch, useSelector } from 'react-redux';
import { ImageInfo, clearImage, selectImage } from '@/entities/image';
import { SaveImageControl } from '@/features/save-image';
import { Button } from '@/shared/ui/Button';
import { InfoPopover } from '@/shared/ui/InfoPopover';
import styles from './ImagePreview.module.scss';

export function ImagePreview() {
  const dispatch = useDispatch();
  const { meta, previewUrl } = useSelector(selectImage);

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <span className={styles.name} title={meta.name}>{meta.name}</span>
        <InfoPopover label="Інформація про зображення">
          <ImageInfo meta={meta} />
        </InfoPopover>
        <Button variant="secondary" onClick={() => dispatch(clearImage())}>
          Замінити зображення
        </Button>
      </div>
      <div className={styles.stage}>
        <img src={previewUrl} alt={`Зображення: ${meta.name}`} />
      </div>
      <SaveImageControl />
    </div>
  );
}
