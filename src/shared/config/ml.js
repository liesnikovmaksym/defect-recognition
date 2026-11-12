export const TRAIN_SIZE = 64;

export const DATASET_GROUPS = [
  { id: 'icons', label: 'Іконки', size: 32 },
  { id: 'standard', label: 'Стандартні', size: 128 },
  { id: 'hq', label: 'Якісні', size: 1024 },
];

export const FILE_FORMATS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'bmp', label: 'BMP' },
];

export const MIXED_FORMAT = 'mixed';

export const FEATURE_MODE = 'diffHist';

export const VARIETY_LEVELS = [
  { value: 'basic', label: 'Базова' },
  { value: 'extended', label: 'Розширена' },
];

export const VARIETY_HINT =
  'Розширена: менші виступи різної форми.';

export const MAX_WORKERS = 8;

export const RECOGNITION_STEPS = [
  { stage: 'Декодування та масштабування до 64×64', value: 0.2 },
  { stage: 'Різниця з еталоном і ознаки', value: 0.7 },
  { stage: 'Класифікація мережею', value: 0.9 },
];
