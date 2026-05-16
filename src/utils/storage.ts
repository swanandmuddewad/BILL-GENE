import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'BillGenDB';
const STORE_NAME = 'settings';

export interface Item {
  id: string;
  name: string;
  boxPrice: number;
  loosePrice: number;
  defaultType: 'box' | 'loose';
}

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const saveItems = async (items: Item[]) => {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, items, 'items');
  } catch (err) {
    console.error("IDB save error:", err);
  }
  // Fallback / sync cache
  try {
    localStorage.setItem('cached_items', JSON.stringify(items));
  } catch (e) {}
};

export const getItems = async (): Promise<Item[]> => {
  let items: Item[] | null = null;
  try {
    const db = await initDB();
    items = await db.get(STORE_NAME, 'items');
  } catch (err) {
    console.error("IDB get error:", err);
  }
  
  if (!items || items.length === 0) {
    try {
      const cached = localStorage.getItem('cached_items');
      if (cached) items = JSON.parse(cached);
    } catch (e) {}
  }
  
  return items || [];
};

export const saveQuantities = (quantities: any) => {
  try {
    localStorage.setItem('cached_quantities', JSON.stringify(quantities));
  } catch(e) {}
};

export const getQuantities = () => {
  try {
    const cached = localStorage.getItem('cached_quantities');
    if (cached) return JSON.parse(cached);
  } catch(e) {}
  return null;
};