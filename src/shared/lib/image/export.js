import { encodeBmp } from './bmp.js';

export const EXPORT_FORMATS = [
  { value: 'png', label: 'PNG', mime: 'image/png' },
  { value: 'jpg', label: 'JPG', mime: 'image/jpeg' },
  { value: 'bmp', label: 'BMP', mime: 'image/bmp' },
];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Не вдалося прочитати зображення'));
    img.src = url;
  });
}

export async function convertImage(url, format) {
  const img = await loadImage(url);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (format === 'jpg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);

  if (format === 'bmp') {
    return encodeBmp(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }
  const { mime } = EXPORT_FORMATS.find((f) => f.value === format);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Не вдалося зберегти'))), mime, 0.92);
  });
}

export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
