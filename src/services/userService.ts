import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

const COLLECTION_NAME = 'users';

export const userService = {
  getUserProfile: (userId: string, callback: (profile: UserProfile | null) => void) => {
    const docRef = doc(db, COLLECTION_NAME, userId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      } else {
        callback(null);
      }
    });
  },

  createUserProfile: async (userId: string, email: string, name?: string) => {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const now = new Date().toISOString();
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    
    const profile: UserProfile = {
      uid: userId,
      email,
      name: name || '',
      subscriptionPlan: 'FREE',
      invoiceCount: 0,
      invoiceCountResetDate: resetDate.toISOString().split('T')[0],
      createdAt: now,
      updatedAt: now
    };
    await setDoc(docRef, profile);
    return profile;
  },

  updateUserProfile: async (userId: string, updates: Partial<UserProfile>) => {
    const docRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
};
