const LABELS = {
  generated: 'Згенероване застосунком',
  drawn: 'Намальоване в застосунку',
};

export const sourceLabel = (source) => LABELS[source] ?? 'Завантажене користувачем';
