/**
 * Offline-First Cache
 * Stores tasks and farm records locally so users can work without internet.
 * Marks items as "pending sync" and merges them when connectivity is restored.
 */

import type { FarmTask } from "./farmService";

const PENDING_TASKS_KEY = "harvest_pending_tasks";
const OFFLINE_TASKS_KEY = "harvest_offline_tasks_cache";
const OFFLINE_RECORDS_KEY = "harvest_offline_records_cache";

export interface PendingTask {
  id: string;
  data: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    dueDate?: string;
    farmRecordId?: string;
  };
  createdAt: string;
  synced: boolean;
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function getPendingTasks(): PendingTask[] {
  try {
    const raw = localStorage.getItem(PENDING_TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingTask(data: PendingTask["data"]): PendingTask {
  const task: PendingTask = {
    id: crypto.randomUUID(),
    data,
    createdAt: new Date().toISOString(),
    synced: false,
  };
  const pending = getPendingTasks();
  pending.push(task);
  try {
    localStorage.setItem(PENDING_TASKS_KEY, JSON.stringify(pending));
  } catch {}
  return task;
}

export function markTaskSynced(id: string): void {
  const pending = getPendingTasks().filter((t) => t.id !== id);
  try {
    localStorage.setItem(PENDING_TASKS_KEY, JSON.stringify(pending));
  } catch {}
}

export function clearPendingTasks(): void {
  try {
    localStorage.removeItem(PENDING_TASKS_KEY);
  } catch {}
}

export function cacheTasksLocally(tasks: FarmTask[]): void {
  try {
    localStorage.setItem(OFFLINE_TASKS_KEY, JSON.stringify({ tasks, cachedAt: Date.now() }));
  } catch {}
}

export function getCachedTasks(): FarmTask[] | null {
  try {
    const raw = localStorage.getItem(OFFLINE_TASKS_KEY);
    if (!raw) return null;
    const { tasks, cachedAt } = JSON.parse(raw);
    const age = Date.now() - cachedAt;
    if (age > 24 * 60 * 60 * 1000) return null; // 24hr TTL
    return tasks;
  } catch {
    return null;
  }
}

export function cacheRecordsLocally(records: unknown[]): void {
  try {
    localStorage.setItem(OFFLINE_RECORDS_KEY, JSON.stringify({ records, cachedAt: Date.now() }));
  } catch {}
}

export function getCachedRecords(): unknown[] | null {
  try {
    const raw = localStorage.getItem(OFFLINE_RECORDS_KEY);
    if (!raw) return null;
    const { records, cachedAt } = JSON.parse(raw);
    const age = Date.now() - cachedAt;
    if (age > 24 * 60 * 60 * 1000) return null;
    return records;
  } catch {
    return null;
  }
}

export function hasPendingSync(): boolean {
  return getPendingTasks().some((t) => !t.synced);
}

export async function syncPendingTasks(
  createFn: (data: PendingTask["data"]) => Promise<unknown>
): Promise<number> {
  if (!isOnline()) return 0;
  const pending = getPendingTasks().filter((t) => !t.synced);
  let synced = 0;
  for (const task of pending) {
    try {
      await createFn(task.data);
      markTaskSynced(task.id);
      synced++;
    } catch {}
  }
  return synced;
}
