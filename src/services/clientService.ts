import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Client } from '../types';

const COLLECTION_NAME = 'clients';

export const clientService = {
  getClients: (userId: string, callback: (clients: Client[]) => void) => {
    const q = query(
      collection(db, 'users', userId, COLLECTION_NAME),
      orderBy('name', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      callback(clients);
    });
  },

  getClient: async (userId: string, clientId: string): Promise<Client | null> => {
    const docRef = doc(db, 'users', userId, COLLECTION_NAME, clientId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Client) : null;
  },

  createClient: async (userId: string, client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = doc(collection(db, 'users', userId, COLLECTION_NAME));
    const now = new Date().toISOString();
    const newClient = {
      ...client,
      id: docRef.id,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(docRef, newClient);
    return docRef.id;
  },

  updateClient: async (userId: string, clientId: string, updates: Partial<Client>) => {
    const docRef = doc(db, 'users', userId, COLLECTION_NAME, clientId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  deleteClient: async (userId: string, clientId: string) => {
    const docRef = doc(db, 'users', userId, COLLECTION_NAME, clientId);
    await deleteDoc(docRef);
  },

  getClientsOnce: async (userId: string): Promise<Client[]> => {
    const q = query(
      collection(db, 'users', userId, COLLECTION_NAME),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  }
};
