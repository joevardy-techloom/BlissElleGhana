const DB_NAME = 'BlissVideoDB';
const STORE_NAME = 'videos';

export interface SavedVideo {
  id: string; // 'landscape' | 'portrait'
  blob: Blob;
  name: string;
  updatedAt: number;
}

export function initVideoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVideoBlob(id: 'landscape' | 'portrait', blob: Blob, name: string): Promise<void> {
  const db = await initVideoDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const data: SavedVideo = {
      id,
      blob,
      name,
      updatedAt: Date.now()
    };
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getVideoBlob(id: 'landscape' | 'portrait'): Promise<SavedVideo | null> {
  const db = await initVideoDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearVideoBlob(id: 'landscape' | 'portrait'): Promise<void> {
  const db = await initVideoDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
