export function encodeBmp(imageData) {
  const { width, height, data } = imageData;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowSize * height;
  const buffer = new ArrayBuffer(54 + pixelBytes);
  const view = new DataView(buffer);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, 54 + pixelBytes, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelBytes, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);

  const bytes = new Uint8Array(buffer);
  for (let y = 0; y < height; y += 1) {
    const rowStart = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x += 1) {
      const src = (y * width + x) * 4;
      const dst = rowStart + x * 3;
      bytes[dst] = data[src + 2];
      bytes[dst + 1] = data[src + 1];
      bytes[dst + 2] = data[src];
    }
  }
  return new Blob([buffer], { type: 'image/bmp' });
}
