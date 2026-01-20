// services/storageService.ts - CORREGIDO CON TIPOS

import { GeneratedImage, Business } from '../types';

const DB_NAME = 'AdAngleDB';
const DB_VERSION = 2;
const STORE_IMAGES = 'images';
const STORE_BUSINESSES = 'businesses';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_BUSINESSES)) {
          db.createObjectStore(STORE_BUSINESSES, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`IndexedDB Error: ${request.error?.message}`));
    } catch (e) {
      reject(new Error("IndexedDB not supported or private mode enabled."));
    }
  });
};

const performDBOp = async <T>(
  mode: IDBTransactionMode,
  storeName: string,
  op: (store: IDBObjectStore) => IDBRequest
): Promise<T> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = op(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`DB Op Failed: ${request.error?.message}`));

      tx.onabort = () => reject(new Error("Transaction Aborted"));
      tx.onerror = () => reject(new Error(`Transaction Failed: ${tx.error?.message}`));
    });
  } catch (e: any) {
    console.error("Storage Error", e);
    if (e.message?.includes('Quota') || e.name === 'QuotaExceededError') {
      throw new Error("Storage quota exceeded. Please delete some images.");
    }
    throw e;
  }
};

// IMAGES - CON TIPOS CORRECTOS
export const saveImageToDB = (image: GeneratedImage) =>
  performDBOp<IDBValidKey>('readwrite', STORE_IMAGES, (s) => s.put(image));

export const getAllImagesFromDB = () =>
  performDBOp<GeneratedImage[]>('readonly', STORE_IMAGES, (s) => s.getAll());

export const deleteImageFromDB = (id: string) =>
  performDBOp<undefined>('readwrite', STORE_IMAGES, (s) => s.delete(id));

// BUSINESSES - CON TIPOS CORRECTOS
export const saveBusinessToDB = (business: Business) =>
  performDBOp<IDBValidKey>('readwrite', STORE_BUSINESSES, (s) => s.put(business));

export const getAllBusinessesFromDB = () =>
  performDBOp<Business[]>('readonly', STORE_BUSINESSES, (s) => s.getAll());

export const deleteBusinessFromDB = (id: string) =>
  performDBOp<undefined>('readwrite', STORE_BUSINESSES, (s) => s.delete(id));

export const clearDB = async () => {
  const db = await openDB();
  const tx = db.transaction([STORE_IMAGES, STORE_BUSINESSES], 'readwrite');
  tx.objectStore(STORE_IMAGES).clear();
  tx.objectStore(STORE_BUSINESSES).clear();
  return new Promise<void>((resolve) => {
    tx.oncomplete = () => resolve();
  });
};
