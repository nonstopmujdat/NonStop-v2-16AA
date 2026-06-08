export type QueueStatus = 'queued' | 'ready' | 'synced';

export type QueueEvent = {
  event_id: string;
  linked_basket_id?: string;
  type: string;
  player?: string;
  status: QueueStatus;
  payload: Record<string, any>;
  created_local_at: string;
};

const KEY = 'nonstop_v19_queue';

export function createEventId() {
  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function createLinkedBasketId() {
  return `basket_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getQueue(): QueueEvent[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

export function setQueue(q: QueueEvent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(q));
}

export function enqueue(e: Omit<QueueEvent, 'created_local_at'>) {
  const q = getQueue();
  q.push({ ...e, created_local_at: new Date().toISOString() });
  setQueue(q);
  return q;
}

export function markSynced() {
  const q = getQueue().map(e => ({ ...e, status: 'synced' as const }));
  setQueue(q);
  return q;
}
