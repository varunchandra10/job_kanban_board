import { api } from './api';

export type MutationAction =
  | 'create_application'
  | 'update_application'
  | 'delete_application'
  | 'move_application'
  | 'create_learning'
  | 'update_learning'
  | 'delete_learning';

export interface QueuedMutation {
  id: string;
  action: MutationAction;
  tempId?: number;
  targetId?: number;
  payload: any;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'job_tracker_mutation_queue';
const ID_MAP_KEY = 'job_tracker_id_map';

export function getMutationQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[OfflineSync] Failed reading mutation queue from localStorage:', err);
    return [];
  }
}

export function saveMutationQueue(queue: QueuedMutation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[OfflineSync] Failed saving mutation queue to localStorage:', err);
  }
}

export function getIdMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(ID_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

export function recordIdMapping(tempId: number | string, serverId: number): void {
  try {
    const map = getIdMap();
    map[String(tempId)] = serverId;
    localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
  } catch (_) {}
}

export function resolveId(id: number | string): number {
  const map = getIdMap();
  const mapped = map[String(id)];
  return mapped ? mapped : Number(id);
}

export function enqueueMutation(
  action: MutationAction,
  payload: any,
  tempId?: number,
  targetId?: number
): QueuedMutation {
  const queue = getMutationQueue();
  const mutation: QueuedMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    action,
    tempId,
    targetId,
    payload,
    timestamp: Date.now(),
    retryCount: 0
  };

  queue.push(mutation);
  saveMutationQueue(queue);
  console.log(`[OfflineSync] Enqueued offline mutation (${action}):`, mutation.id);
  return mutation;
}

export function hasPendingMutations(): boolean {
  return getMutationQueue().length > 0;
}

export function clearMutationQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}

export interface FlushResult {
  processed: number;
  remaining: number;
  idMap: Record<string, number>;
  errors: string[];
}

let isFlushing = false;

export async function flushMutationQueue(
  onIdMapped?: (tempId: number, serverId: number, itemType: 'application' | 'learning') => void
): Promise<FlushResult> {
  if (isFlushing) {
    return {
      processed: 0,
      remaining: getMutationQueue().length,
      idMap: getIdMap(),
      errors: ['Sync already in progress']
    };
  }

  isFlushing = true;
  const queue = getMutationQueue();
  const idMap = getIdMap();
  const errors: string[] = [];
  let processed = 0;

  try {
    while (queue.length > 0) {
      const item = queue[0];
      try {
        if (item.action === 'create_application') {
          const serverApp = await api.createApplication(item.payload);
          if (serverApp?.id && item.tempId) {
            idMap[String(item.tempId)] = serverApp.id;
            recordIdMapping(item.tempId, serverApp.id);
            if (onIdMapped) onIdMapped(item.tempId, serverApp.id, 'application');
          }
        } else if (item.action === 'update_application') {
          const effectiveId = item.targetId ? (idMap[String(item.targetId)] || item.targetId) : 0;
          if (effectiveId) {
            await api.updateApplication(effectiveId, item.payload);
          }
        } else if (item.action === 'delete_application') {
          const effectiveId = item.targetId ? (idMap[String(item.targetId)] || item.targetId) : 0;
          if (effectiveId) {
            await api.deleteApplication(effectiveId);
          }
        } else if (item.action === 'move_application') {
          const effectiveId = item.targetId ? (idMap[String(item.targetId)] || item.targetId) : 0;
          if (effectiveId) {
            const beforeId = item.payload.before ? (idMap[String(item.payload.before)] || item.payload.before) : undefined;
            await api.moveApplication(effectiveId, item.payload.stage, beforeId);
          }
        } else if (item.action === 'create_learning') {
          const serverLearning = await api.createLearning(item.payload);
          if (serverLearning?.id && item.tempId) {
            idMap[String(item.tempId)] = serverLearning.id;
            recordIdMapping(item.tempId, serverLearning.id);
            if (onIdMapped) onIdMapped(item.tempId, serverLearning.id, 'learning');
          }
        } else if (item.action === 'update_learning') {
          const effectiveId = item.targetId ? (idMap[String(item.targetId)] || item.targetId) : 0;
          if (effectiveId) {
            await api.updateLearning(effectiveId, item.payload);
          }
        } else if (item.action === 'delete_learning') {
          const effectiveId = item.targetId ? (idMap[String(item.targetId)] || item.targetId) : 0;
          if (effectiveId) {
            await api.deleteLearning(effectiveId);
          }
        }

        // Successfully processed this mutation; remove from queue
        queue.shift();
        processed++;
        saveMutationQueue(queue);
      } catch (err: any) {
        console.warn(`[OfflineSync] Mutation failed (${item.action}):`, err.message);
        errors.push(`${item.action}: ${err.message}`);
        item.retryCount = (item.retryCount || 0) + 1;
        saveMutationQueue(queue);
        break; // Stop loop on network failure to maintain FIFO ordering
      }
    }
  } finally {
    isFlushing = false;
  }

  return {
    processed,
    remaining: queue.length,
    idMap,
    errors
  };
}

