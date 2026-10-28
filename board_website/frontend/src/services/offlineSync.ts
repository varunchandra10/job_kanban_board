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
  userId?: string;
}

export interface DeadLetterItem {
  mutation: QueuedMutation;
  error: string;
  failedAt: number;
}

const BASE_STORAGE_KEY = 'job_tracker_mutation_queue';
const BASE_ID_MAP_KEY = 'job_tracker_id_map';
const BASE_DEAD_LETTER_KEY = 'job_tracker_dead_letter_queue';

/**
 * Resolves the currently active authenticated user ID from localStorage.
 * Checks 'auth_user' object first, then decodes the payload from 'auth_token' JWT.
 * Defaults to 'anonymous' if unauthenticated.
 */
export function getActiveUserId(): string {
  try {
    if (typeof localStorage === 'undefined') return 'anonymous';

    // 1. Check auth_user profile object
    const authUserRaw = localStorage.getItem('auth_user');
    if (authUserRaw) {
      try {
        const parsed = JSON.parse(authUserRaw);
        if (parsed?.id) return String(parsed.id);
      } catch (_) {}
    }

    // 2. Fallback: decode JWT payload in auth_token
    const token = localStorage.getItem('auth_token');
    if (token && token.includes('.')) {
      try {
        const parts = token.split('.');
        if (parts[1]) {
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          let decoded = '';
          if (typeof atob === 'function') {
            decoded = atob(base64);
          } else if (typeof (globalThis as any).Buffer !== 'undefined') {
            decoded = (globalThis as any).Buffer.from(base64, 'base64').toString('binary');
          }
          if (decoded) {
            const payload = JSON.parse(decoded);
            if (payload?.id) return String(payload.id);
            if (payload?.userId) return String(payload.userId);
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  return 'anonymous';
}

export function getQueueStorageKey(userId?: string): string {
  const uid = userId !== undefined ? String(userId) : getActiveUserId();
  return uid && uid !== 'anonymous' ? `${BASE_STORAGE_KEY}_${uid}` : BASE_STORAGE_KEY;
}

export function getIdMapStorageKey(userId?: string): string {
  const uid = userId !== undefined ? String(userId) : getActiveUserId();
  return uid && uid !== 'anonymous' ? `${BASE_ID_MAP_KEY}_${uid}` : BASE_ID_MAP_KEY;
}

export function getDeadLetterStorageKey(userId?: string): string {
  const uid = userId !== undefined ? String(userId) : getActiveUserId();
  return uid && uid !== 'anonymous' ? `${BASE_DEAD_LETTER_KEY}_${uid}` : BASE_DEAD_LETTER_KEY;
}

/**
 * Migrates legacy un-scoped offline queue data into user-scoped storage key.
 */
function checkAndMigrateLegacyQueue(key: string, uid: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (uid && uid !== 'anonymous' && key !== BASE_STORAGE_KEY) {
      const scopedRaw = localStorage.getItem(key);
      const legacyRaw = localStorage.getItem(BASE_STORAGE_KEY);
      if (!scopedRaw && legacyRaw) {
        const legacyItems = JSON.parse(legacyRaw);
        if (Array.isArray(legacyItems) && legacyItems.length > 0) {
          const migrated = legacyItems.map(item => ({ ...item, userId: uid }));
          localStorage.setItem(key, JSON.stringify(migrated));
          localStorage.removeItem(BASE_STORAGE_KEY);
        }
      }

      const idMapKey = getIdMapStorageKey(uid);
      const scopedIdMap = localStorage.getItem(idMapKey);
      const legacyIdMap = localStorage.getItem(BASE_ID_MAP_KEY);
      if (!scopedIdMap && legacyIdMap) {
        localStorage.setItem(idMapKey, legacyIdMap);
        localStorage.removeItem(BASE_ID_MAP_KEY);
      }
    }
  } catch (_) {}
}

export function getDeadLetterQueue(userId?: string): DeadLetterItem[] {
  try {
    const key = getDeadLetterStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[OfflineSync] Failed reading dead letter queue:', err);
    return [];
  }
}

export function saveDeadLetterQueue(items: DeadLetterItem[], userId?: string): void {
  try {
    const key = getDeadLetterStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.warn('[OfflineSync] Failed saving dead letter queue:', err);
  }
}

export function pushDeadLetter(item: QueuedMutation, error: string, userId?: string): void {
  try {
    const uid = userId !== undefined ? String(userId) : (item.userId || getActiveUserId());
    const list = getDeadLetterQueue(uid);
    list.push({
      mutation: item,
      error,
      failedAt: Date.now()
    });
    // Keep at most 50 recent failed mutations to avoid localStorage overflow
    if (list.length > 50) list.splice(0, list.length - 50);
    saveDeadLetterQueue(list, uid);
  } catch (e) {
    console.warn('[OfflineSync] Could not record dead letter item:', e);
  }
}

export function clearDeadLetterQueue(userId?: string): void {
  try {
    const key = getDeadLetterStorageKey(userId);
    localStorage.removeItem(key);
  } catch (_) {}
}

export function getMutationQueue(userId?: string): QueuedMutation[] {
  try {
    const uid = userId !== undefined ? String(userId) : getActiveUserId();
    const key = getQueueStorageKey(uid);
    checkAndMigrateLegacyQueue(key, uid);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[OfflineSync] Failed reading mutation queue from localStorage:', err);
    return [];
  }
}

export function saveMutationQueue(queue: QueuedMutation[], userId?: string): void {
  try {
    const key = getQueueStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(queue));
  } catch (err) {
    console.warn('[OfflineSync] Failed saving mutation queue to localStorage:', err);
  }
}

export function getIdMap(userId?: string): Record<string, number> {
  try {
    const key = getIdMapStorageKey(userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

export function recordIdMapping(tempId: number | string, serverId: number, userId?: string): void {
  try {
    const key = getIdMapStorageKey(userId);
    const map = getIdMap(userId);
    map[String(tempId)] = serverId;
    localStorage.setItem(key, JSON.stringify(map));
  } catch (_) {}
}

export function resolveId(id: number | string, userId?: string): number {
  const map = getIdMap(userId);
  const mapped = map[String(id)];
  return mapped ? mapped : Number(id);
}

export function enqueueMutation(
  action: MutationAction,
  payload: any,
  tempId?: number,
  targetId?: number,
  userId?: string
): QueuedMutation {
  const uid = userId !== undefined ? String(userId) : getActiveUserId();
  const queue = getMutationQueue(uid);
  const mutation: QueuedMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    action,
    tempId,
    targetId,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    userId: uid !== 'anonymous' ? uid : undefined
  };

  queue.push(mutation);
  saveMutationQueue(queue, uid);
  console.log(`[OfflineSync] Enqueued offline mutation (${action}) for user [${uid}]:`, mutation.id);
  return mutation;
}

export function hasPendingMutations(userId?: string): boolean {
  return getMutationQueue(userId).length > 0;
}

export function clearMutationQueue(userId?: string): void {
  try {
    const key = getQueueStorageKey(userId);
    localStorage.removeItem(key);
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
  onIdMapped?: (tempId: number, serverId: number, itemType: 'application' | 'learning') => void,
  userId?: string
): Promise<FlushResult> {
  const uid = userId !== undefined ? String(userId) : getActiveUserId();

  if (isFlushing) {
    return {
      processed: 0,
      remaining: getMutationQueue(uid).length,
      idMap: getIdMap(uid),
      errors: ['Sync already in progress']
    };
  }

  isFlushing = true;
  const queue = getMutationQueue(uid);
  const idMap = getIdMap(uid);
  const errors: string[] = [];
  let processed = 0;

  try {
    while (queue.length > 0) {
      const item = queue[0];
      // Defensive check: if item belongs to a different user, halt processing for this user
      if (item.userId && uid !== 'anonymous' && item.userId !== uid) {
        console.warn(`[OfflineSync] Skipping mutation ${item.id} belonging to user ${item.userId} while active user is ${uid}`);
        break;
      }

      try {
        if (item.action === 'create_application') {
          const serverApp = await api.createApplication(item.payload);
          if (serverApp?.id && item.tempId) {
            idMap[String(item.tempId)] = serverApp.id;
            recordIdMapping(item.tempId, serverApp.id, uid);
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
            recordIdMapping(item.tempId, serverLearning.id, uid);
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
        saveMutationQueue(queue, uid);
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        console.warn(`[OfflineSync] Mutation failed (${item.action}):`, errorMsg);
        errors.push(`${item.action}: ${errorMsg}`);
        item.retryCount = (item.retryCount || 0) + 1;

        // Check if error is a permanent client error (4xx) except 429 Too Many Requests
        const isClient4xx = /HTTP\s+4(?!29)\d\d/i.test(errorMsg) || /status[:\s]+4(?!29)\d\d/i.test(errorMsg);
        const hasExceededRetries = item.retryCount >= 3;

        if (isClient4xx || hasExceededRetries) {
          console.warn(`[OfflineSync] Poison pill or max retries reached for ${item.id}. Dead-lettering and advancing queue.`);
          pushDeadLetter(item, errorMsg, uid);
          // Drop poisoned item from queue to prevent head-of-line blocking
          queue.shift();
          saveMutationQueue(queue, uid);
          // Continue processing remaining valid mutations
          continue;
        }

        // Transient network or server failure (e.g. offline, 5xx, 429) -> keep at head and break
        saveMutationQueue(queue, uid);
        break;
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
