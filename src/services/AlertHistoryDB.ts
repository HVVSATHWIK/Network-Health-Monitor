/**
 * IndexedDB-backed alert history.
 * Resolved alerts are archived here so users can review past incidents.
 */

import type { Alert } from '../types/network';

const DB_NAME = 'netmonit-alert-history';
const DB_VERSION = 1;
const STORE_NAME = 'alerts';

export interface ArchivedAlert {
  /** Original alert id + resolution timestamp for uniqueness */
  historyId: string;
  id: string;
  severity: Alert['severity'];
  layer: Alert['layer'];
  device: string;
  message: string;
  /** When the alert was created */
  timestamp: number;
  /** When the alert was resolved / cleared */
  resolvedAt: number;
  aiCorrelation?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'historyId' });
        store.createIndex('resolvedAt', 'resolvedAt', { unique: false });
        store.createIndex('device', 'device', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Archive resolved alerts into IndexedDB.
 */
export async function archiveAlerts(alerts: Alert[]): Promise<void> {
  if (alerts.length === 0) return;

  const db = await openDB();
  const now = Date.now();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const alert of alerts) {
    const archived: ArchivedAlert = {
      historyId: `${alert.id}-${now}`,
      id: alert.id,
      severity: alert.severity,
      layer: alert.layer,
      device: alert.device,
      message: alert.message,
      timestamp: new Date(alert.timestamp).getTime(),
      resolvedAt: now,
      aiCorrelation: alert.aiCorrelation,
    };
    store.put(archived);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * Get alert history, most recent first.
 * @param limit Max records to return (default 200)
 */
export async function getAlertHistory(limit = 200): Promise<ArchivedAlert[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('resolvedAt');

  return new Promise((resolve, reject) => {
    const results: ArchivedAlert[] = [];
    const req = index.openCursor(null, 'prev'); // newest first

    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value as ArchivedAlert);
        cursor.continue();
      } else {
        db.close();
        resolve(results);
      }
    };

    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/**
 * Clear all alert history.
 */
export async function clearAlertHistory(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * Get count of archived alerts.
 */
export async function getAlertHistoryCount(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const req = store.count();
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
