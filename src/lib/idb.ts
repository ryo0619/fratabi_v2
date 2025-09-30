// Tiny IndexedDB helpers without external deps

export function openDB(name: string, version: number, upgrade: (db: IDBDatabase) => void) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => {
      const db = req.result;
      upgrade(db);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function tx<T = unknown>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => T | Promise<T>
) {
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    let result: T | Promise<T>;
    try {
      result = fn(store);
    } catch (e) {
      reject(e);
      return;
    }
    t.oncomplete = async () => {
      try {
        resolve(await result);
      } catch (e) {
        reject(e);
      }
    };
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

