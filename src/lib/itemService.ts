import { 
  collection, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy,
  writeBatch
} from 'firebase/firestore';

import { db, auth } from './firebase';

export interface Item {
  id: string;
  name: string;
  boxPrice: number;
  loosePrice: number;
  defaultType: 'box' | 'loose';
  userId: string;
  order?: number;
  updatedAt?: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const subscribeToItems = (userId: string, callback: (items: Item[]) => void) => {
  const q = query(
    collection(db, 'items'), 
    where('userId', '==', userId),
    orderBy('order', 'asc'),
    orderBy('name', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => doc.data() as Item);
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'items');
  });
};

export const addItem = async (item: Omit<Item, 'userId'>) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const itemData = {
    ...item,
    userId,
    order: item.order ?? 0,
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'items', item.id), itemData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `items/${item.id}`);
  }
};

export const updateItem = async (id: string, updates: Partial<Item>) => {
  try {
    const itemRef = doc(db, 'items', id);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `items/${id}`);
  }
};

export const updateItemsOrder = async (items: Item[]) => {
  try {
    const batch = writeBatch(db);
    items.forEach((item, index) => {
      const itemRef = doc(db, 'items', item.id);
      batch.update(itemRef, { order: index });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'items/batch-order');
  }
};

export const removeItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'items', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `items/${id}`);
  }
};
