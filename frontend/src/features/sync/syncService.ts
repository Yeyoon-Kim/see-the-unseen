const syncQueueKey = "class-manager-sync-queue";
const syncedCachePrefix = "class-manager-cache";
const authSessionStorageKey = "class-manager-auth-session";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

export type SyncCollection =
  | "events"
  | "categories"
  | "theme"
  | "settings"
  | "preferences"
  | "today-tasks"
  | "field-memory"
  | "user-settings";

export interface SyncRecord<T = unknown> {
  id: string;
  userId: string;
  collection: SyncCollection;
  action: "upsert" | "delete";
  payload: T;
  updatedAt: string;
}

interface StoredAuthSession {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken?: string;
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    if (typeof window.localStorage === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  try {
    if (typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Offline cache is a best-effort layer.
  }
}

function readAuthSession() {
  return safeRead<StoredAuthSession | null>(authSessionStorageKey, null);
}

function activeUserId(fallbackUserId: string) {
  return readAuthSession()?.user?.id ?? fallbackUserId;
}

export function cacheCollection<T>(userId: string, collection: SyncCollection, value: T) {
  safeWrite(`${syncedCachePrefix}:${activeUserId(userId)}:${collection}`, value);
}

export function readCachedCollection<T>(userId: string, collection: SyncCollection, fallback: T) {
  return safeRead<T>(`${syncedCachePrefix}:${activeUserId(userId)}:${collection}`, fallback);
}

export function enqueueSync<T>(
  userId: string,
  collection: SyncCollection,
  action: SyncRecord["action"],
  payload: T
) {
  const queue = safeRead<SyncRecord[]>(syncQueueKey, []);
  const resolvedUserId = activeUserId(userId);
  const record: SyncRecord<T> = {
    id: `${collection}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId: resolvedUserId,
    collection,
    action,
    payload,
    updatedAt: new Date().toISOString()
  };
  safeWrite(syncQueueKey, [...queue, record]);
  return record;
}

export function readSyncQueue() {
  return safeRead<SyncRecord[]>(syncQueueKey, []);
}

export function clearSyncedRecords(ids: string[]) {
  const idSet = new Set(ids);
  safeWrite(
    syncQueueKey,
    readSyncQueue().filter((record) => !idSet.has(record.id))
  );
}

function recordKey(record: SyncRecord) {
  if (record.payload && typeof record.payload === "object" && "id" in record.payload) {
    const id = (record.payload as { id?: unknown }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }

  return record.collection;
}

async function sendToSupabase(record: SyncRecord, session: StoredAuthSession) {
  if (!hasSupabase || !session.accessToken || !session.user?.id) {
    throw new Error("Remote sync is not configured.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/user_data?on_conflict=user_id,collection,record_id`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      user_id: session.user.id,
      collection: record.collection,
      record_id: recordKey(record),
      action: record.action,
      payload: record.payload,
      updated_at: record.updatedAt
    })
  });

  if (!response.ok) throw new Error("Remote sync failed.");
}

export async function flushSyncQueue() {
  const queue = readSyncQueue();
  if (!queue.length) return { attempted: 0, synced: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { attempted: queue.length, synced: 0 };
  }

  const session = readAuthSession();
  if (!hasSupabase || !session?.accessToken || !session.user?.id) {
    return { attempted: queue.length, synced: 0 };
  }

  const syncedIds: string[] = [];

  for (const record of queue) {
    try {
      await sendToSupabase(record, session);
      syncedIds.push(record.id);
    } catch {
      break;
    }
  }

  if (syncedIds.length) clearSyncedRecords(syncedIds);
  return { attempted: queue.length, synced: syncedIds.length };
}
