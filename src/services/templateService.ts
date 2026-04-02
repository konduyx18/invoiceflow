import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InvoiceTemplate } from '../types';

const COLLECTION = 'invoice_templates';

export const templateService = {
  async createTemplate(userId: string, data: Omit<InvoiceTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  getTemplates(userId: string, callback: (data: InvoiceTemplate[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InvoiceTemplate[];
      callback(data);
    });
  },

  async getTemplatesOnce(userId: string) {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InvoiceTemplate[];
  },

  async updateTemplate(id: string, data: Partial<InvoiceTemplate>) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteTemplate(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};
