import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  Timestamp,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RecurringInvoice, Invoice } from '../types';
import { invoiceService } from './invoiceService';

const COLLECTION = 'recurring_invoices';

export const recurringService = {
  async createRecurringInvoice(userId: string, data: Omit<RecurringInvoice, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  getRecurringInvoices(userId: string, callback: (data: RecurringInvoice[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecurringInvoice[];
      callback(data);
    });
  },

  async updateRecurringInvoice(id: string, data: Partial<RecurringInvoice>) {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteRecurringInvoice(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  // This function would normally run in a cloud function, 
  // but we'll call it when the user logs in/visits dashboard to simulate automation.
  async processRecurringInvoices(userId: string) {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    for (const docSnap of snapshot.docs) {
      const recurring = { id: docSnap.id, ...docSnap.data() } as RecurringInvoice;
      
      if (recurring.nextGenerationDate <= today) {
        // Generate new invoice
        const invoiceNumber = `INV-REC-${Math.floor(1000 + Math.random() * 9000)}`;
        const issueDate = today;
        
        // Calculate due date based on template or default (e.g., +30 days)
        const dueDateObj = new Date(now);
        dueDateObj.setDate(dueDateObj.getDate() + 30);
        const dueDate = dueDateObj.toISOString().split('T')[0];

        const newInvoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
          ...recurring.template,
          invoiceNumber,
          status: 'SENT', // Automate sending
          issueDate,
          dueDate,
          isRecurring: true,
          recurringId: recurring.id
        };

        await invoiceService.createInvoice(userId, newInvoice);

        // Update recurring record with next date
        const nextDate = new Date(now);
        if (recurring.frequency === 'WEEKLY') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (recurring.frequency === 'MONTHLY') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (recurring.frequency === 'YEARLY') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }

        const nextGenerationDate = nextDate.toISOString().split('T')[0];
        
        // Check if we passed the end date
        let isActive = true;
        if (recurring.endDate && nextGenerationDate > recurring.endDate) {
          isActive = false;
        }

        await this.updateRecurringInvoice(recurring.id, {
          lastGeneratedDate: today,
          nextGenerationDate,
          isActive
        });
      }
    }
  }
};
