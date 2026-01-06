/**
 * IndexedDB Database Service
 * Handles all persistent storage operations
 */

const DB_NAME = 'AgentOrchestrator_V37_MultiProvider';
const STORE_NAME = 'app_state';
const HISTORY_STORE = 'run_history';
const DB_VERSION = 5;

const dbCore = {
  _db: null,

  open: () => new Promise((resolve, reject) => {
    if (dbCore._db) {
      resolve(dbCore._db);
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => {
      dbCore._db = e.target.result;
      resolve(dbCore._db);
    };
    req.onerror = (e) => reject(e.target.error);
  }),

  save: async (key, data) => {
    const db = await dbCore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  load: async (key) => {
    const db = await dbCore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  saveRun: async (runData) => {
    const db = await dbCore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([HISTORY_STORE], 'readwrite');
      const store = tx.objectStore(HISTORY_STORE);
      store.put(runData);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  loadAllRuns: async () => {
    const db = await dbCore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([HISTORY_STORE], 'readonly');
      const store = tx.objectStore(HISTORY_STORE);
      const req = store.getAll();
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  deleteRun: async (id) => {
    const db = await dbCore.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([HISTORY_STORE], 'readwrite');
      const store = tx.objectStore(HISTORY_STORE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  wipe: async () => {
    if (dbCore._db) {
      dbCore._db.close();
      dbCore._db = null;
    }
    return new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
      req.onblocked = () => resolve();
    });
  }
};

export default dbCore;
