import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadImageFile, selectImage } from '@/entities/image';
import { Button } from '@/shared/ui/Button';
import styles from './ImageUploader.module.scss';

export function ImageUploader() {
  const dispatch = useDispatch();
  const { status, error } = useSelector(selectImage);
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const loading = status === 'loading';

  const open = () => inputRef.current.click();
  const handleFile = (file) => {
    if (file) dispatch(loadImageFile({ file, source: 'upload' }));
  };

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Завантажити зображення"
      onClick={open}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        aria-label="Файл зображення"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          handleFile(e.target.files[0]);
          e.target.value = '';
        }}
      />
      <strong className={styles.title}>{loading ? 'Завантаження…' : 'Перетягніть зображення сюди'}</strong>
      <span className={styles.hint}>або натисніть, щоб вибрати файл. PNG, JPG, BMP, WebP</span>
      <Button tabIndex={-1} disabled={loading}>Вибрати файл</Button>
      {error && <span className={styles.error} role="alert">{error}</span>}
    </div>
  );
}
