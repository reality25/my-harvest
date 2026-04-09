/**
 * System Logger — logs errors and events to localStorage (and optionally Supabase).
 * Never crashes the app; always fails silently.
 */

const LOG_KEY = "harvest_system_logs";
const MAX_LOGS = 100;

export type LogLevel = "info" | "warn" | "error";

export interface SystemLog {
  id: string;
  level: LogLevel;
  module: string;
  message: string;
  details?: string;
  timestamp: string;
}

function readLogs(): SystemLog[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLogs(logs: SystemLog[]): void {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
  } catch {}
}

export function log(level: LogLevel, module: string, message: string, details?: unknown): void {
  try {
    const entry: SystemLog = {
      id: crypto.randomUUID(),
      level,
      module,
      message,
      details: details ? JSON.stringify(details).slice(0, 500) : undefined,
      timestamp: new Date().toISOString(),
    };
    const logs = readLogs();
    logs.push(entry);
    writeLogs(logs);
    if (level === "error") console.error(`[${module}]`, message, details);
    else if (level === "warn") console.warn(`[${module}]`, message, details);
  } catch {}
}

export function getRecentLogs(limit = 20): SystemLog[] {
  return readLogs().slice(-limit).reverse();
}

export function clearLogs(): void {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {}
}
