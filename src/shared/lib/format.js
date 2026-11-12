export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}

export function getExtension(filename) {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

export function formatMs(ms) {
  return ms < 1000 ? `${ms.toFixed(0)} мс` : `${(ms / 1000).toFixed(2)} с`;
}

export const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;
