import { auth, db } from './firebase';
import { doc, setDoc, deleteDoc, collection, getDocs, writeBatch, getDoc } from 'firebase/firestore';
import { Task, Category, TimeEntry, RecurringTask, AppSettings, Language } from './types';

// Generic helper to get user's subcollection path
const getDocPath = (col: string, id: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return doc(db, 'users', uid, col, id);
};

export const syncFirebase = {
  // Sync individual items
  setTask: async (task: Task) => {
    if (!auth.currentUser) return;
    await setDoc(getDocPath('tasks', task.id), { ...task, userId: auth.currentUser.uid });
  },
  deleteTask: async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(getDocPath('tasks', id));
  },
  setRecurringTask: async (task: RecurringTask) => {
    if (!auth.currentUser) return;
    await setDoc(getDocPath('recurringTasks', task.id), { ...task, userId: auth.currentUser.uid });
  },
  deleteRecurringTask: async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(getDocPath('recurringTasks', id));
  },
  setCategory: async (category: Category) => {
    if (!auth.currentUser) return;
    await setDoc(getDocPath('categories', category.id), { ...category, userId: auth.currentUser.uid });
  },
  deleteCategory: async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(getDocPath('categories', id));
  },
  setTimeEntry: async (entry: TimeEntry) => {
    if (!auth.currentUser) return;
    await setDoc(getDocPath('timeEntries', entry.id), { ...entry, userId: auth.currentUser.uid });
  },
  deleteTimeEntry: async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(getDocPath('timeEntries', id));
  },
  updateProfile: async (data: any) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid), data, { merge: true });
  },

  // Batch import local data to Firebase
  importLocalDataToFirebase: async (data: {
    tasks: Task[];
    recurringTasks: RecurringTask[];
    categories: Category[];
    timeEntries: TimeEntry[];
    settings: AppSettings;
    language: Language;
  }) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const batch = writeBatch(db);

    // Profile settings
    batch.set(doc(db, 'users', uid), {
      uid: uid,
      email: auth.currentUser.email || '',
      settings: data.settings,
      language: data.language,
      theme: data.settings.theme,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // We can only do 500 writes per batch. If they have massive data, we'd need chunks.
    // For simplicity, we chunk them.
    let count = 1;
    let currentBatch = batch;

    const commitBatch = async () => {
      await currentBatch.commit();
      currentBatch = writeBatch(db);
      count = 0;
    };

    const addOp = async (col: string, id: string, item: any) => {
      currentBatch.set(doc(db, 'users', uid, col, id), { ...item, userId: uid });
      count++;
      if (count >= 490) await commitBatch();
    };

    for (const t of data.tasks) await addOp('tasks', t.id, t);
    for (const t of data.recurringTasks) await addOp('recurringTasks', t.id, t);
    for (const c of data.categories) await addOp('categories', c.id, c);
    for (const t of data.timeEntries) await addOp('timeEntries', t.id, t);

    if (count > 0) await currentBatch.commit();
  },

  // Fetch all user data
  fetchAllUserData: async () => {
    if (!auth.currentUser) return null;
    const uid = auth.currentUser.uid;

    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    const tasksSnap = await getDocs(collection(db, 'users', uid, 'tasks'));
    const recurringTasksSnap = await getDocs(collection(db, 'users', uid, 'recurringTasks'));
    const categoriesSnap = await getDocs(collection(db, 'users', uid, 'categories'));
    const timeEntriesSnap = await getDocs(collection(db, 'users', uid, 'timeEntries'));

    return {
      profile: userData,
      tasks: tasksSnap.docs.map(d => d.data() as Task),
      recurringTasks: recurringTasksSnap.docs.map(d => d.data() as RecurringTask),
      categories: categoriesSnap.docs.map(d => d.data() as Category),
      timeEntries: timeEntriesSnap.docs.map(d => d.data() as TimeEntry),
    };
  },

  // Wipe user data
  wipeUserData: async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const collections = ['tasks', 'recurringTasks', 'categories', 'timeEntries'];
    
    for (const col of collections) {
      const snap = await getDocs(collection(db, 'users', uid, col));
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.delete(d.ref);
      });
      if (snap.size > 0) {
        await batch.commit(); // Note: if > 500 docs, this needs chunking. Safe enough for reset.
      }
    }
  }
};
