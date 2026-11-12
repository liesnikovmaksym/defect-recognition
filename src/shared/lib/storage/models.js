const INDEX_KEY = 'defect-recognition:models';
const payloadKey = (id) => `defect-recognition:model:${id}`;

const empty = () => ({ items: [], activeId: null, seq: 0 });

export function loadIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw);
    const items = (Array.isArray(data.items) ? data.items : []).filter(
      (item) => localStorage.getItem(payloadKey(item.id)) !== null,
    );
    const activeId = items.some((item) => item.id === data.activeId) ? data.activeId : (items[0]?.id ?? null);
    return { items, activeId, seq: Number(data.seq) || 0 };
  } catch {
    return empty();
  }
}

export function saveIndex({ items, activeId, seq }) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify({ items, activeId, seq }));
  } catch {
  }
}

export function savePayload(id, payload) {
  localStorage.setItem(payloadKey(id), JSON.stringify(payload));
}

export function loadPayload(id) {
  try {
    const raw = localStorage.getItem(payloadKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function removePayload(id) {
  try {
    localStorage.removeItem(payloadKey(id));
  } catch {
  }
}
