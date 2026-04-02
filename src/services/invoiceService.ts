import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Invoice, InvoiceStatus } from '../types';

const COLLECTION_NAME = 'invoices';

export const invoiceService = {
  getInvoices: (userId: string, callback: (invoices: Invoice[]) => void) => {
    const q = query(
      collection(db, 'users', userId, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      callback(invoices);
    });
  },

  getInvoice: async (userId: string, invoiceId: string): Promise<Invoice | null> => {
    const docRef = doc(db, 'users', userId, COLLECTION_NAME, invoiceId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Invoice) : null;
  },

  createInvoice: async (userId: string, invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = doc(collection(db, 'users', userId, COLLECTION_NAME));
    const now = new Date().toISOString();
    const newInvoice = {
      ...invoice,
      id: docRef.id,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(docRef, newInvoice);

    // Increment user invoice count
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      await updateDoc(userRef, {
        invoiceCount: (userData.invoiceCount || 0) + 1,
        updatedAt: now
      });
    }
    
    return docRef.id;
  },

  updateInvoice: async (userId: string, invoiceId: string, updates: Partial<Invoice>) => {
    const docRef = doc(db, 'users', userId, COLLECTION_NAME, invoiceId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  deleteInvoice: async (userId: string, invoiceId: string) => {
    const docRef = doc(db, 'users', userId, COLLECTION_NAME, invoiceId);
    await deleteDoc(docRef);
  },

  getInvoicesOnce: async (userId: string): Promise<Invoice[]> => {
    const q = query(
      collection(db, 'users', userId, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
  },

  updateStatus: async (userId: string, invoiceId: string, status: InvoiceStatus) => {
    const updates: Partial<Invoice> = { status };
    if (status === 'PAID') {
      updates.paidAt = new Date().toISOString();
    }
    await updateDoc(doc(db, 'users', userId, COLLECTION_NAME, invoiceId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
};
