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
  const db = await initDB();
  await db.put(STORE_NAME, items, 'items');
};

export const getItems = async (): Promise<Item[]> => {
  const db = await initDB();
  return (await db.get(STORE_NAME, 'items')) || [];
};
