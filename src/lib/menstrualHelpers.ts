import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface MenstrualCycle {
  id: string;
  startDate: string;
  endDate?: string;
  duration?: number;
  cycleLength?: number;
  notes?: string;
}

export const menstrualHelpers = {
  getCycles: async (): Promise<MenstrualCycle[]> => {
    if (!auth.currentUser) return [];
    const uid = auth.currentUser.uid;
    const cyclesRef = collection(db, 'users', uid, 'specialFeatures');
    const snapshot = await getDocs(cyclesRef);
    const cycles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenstrualCycle));
    return cycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  },
  
  saveCycle: async (cycle: MenstrualCycle): Promise<void> => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid, 'specialFeatures', cycle.id);
    await setDoc(docRef, cycle);
  },
  
  deleteCycle: async (id: string): Promise<void> => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid, 'specialFeatures', id);
    await deleteDoc(docRef);
  }
};
