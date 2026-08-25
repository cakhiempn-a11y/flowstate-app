import { syncFirebase } from '../firebaseHelpers';
import { create } from 'zustand';
import { AppSettings } from '../types';
import { persist } from 'zustand/middleware';
import { AppState, Task, Category, TimeEntry, WorkingHours, Status } from '../types';
import { isBefore, parseISO, differenceInMinutes, addDays, format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';


export const defaultSettings: AppSettings = {
  theme: 'system',
  loginWelcomeImage: null,
  workingHours: {
    0: { enabled: false, start: '09:00', end: '17:00' },
    1: { enabled: true, start: '08:00', end: '18:00' },
    2: { enabled: true, start: '08:00', end: '18:00' },
    3: { enabled: true, start: '08:00', end: '18:00' },
    4: { enabled: true, start: '08:00', end: '18:00' },
    5: { enabled: true, start: '08:00', end: '18:00' },
    6: { enabled: false, start: '09:00', end: '17:00' },
  },
  defaultTimeSlot: 30,
  weekStartsOn: 1,
  timeFormat: '24h',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  taskDurationPresets: [15, 30, 45, 60, 90, 120, 180, 240, 360, 480],
  taskDefaults: {
    priority: 'Medium',
    status: 'Not Started',
    duration: 30,
    categoryId: null,
  },
  completionBehavior: 'auto',
  notifications: {
    taskReminders: true,
    reminderTime: 15,
    overdueAlerts: true,
    dailySummary: true,
    dailySummaryTime: '07:00',
  },
  analytics: {
    efficiencyCalculation: 'actual_vs_planned',
    workloadHighThreshold: 90,
    workloadOverloadThreshold: 100,
    enabledWidgets: ['completionRate', 'plannedTime', 'actualTime', 'efficiency', 'taskStatus', 'timeByCategory', 'productivityTrend', 'overdueTasks'],
    timelineInterval: 60,
    showInsightDescriptions: true,
    enabledInsights: ['completionRate', 'scheduledTimeRatio', 'freeTime', 'busiestDay', 'freestDay', 'mostTimeConsumingCategory', 'mostOverloadedDay'],
  },
};

export const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'English', color: '#4f46e5', icon: 'book' },
  { id: 'cat-2', name: 'Work', color: '#6366f1', icon: 'briefcase' },
  { id: 'cat-3', name: 'Exercise', color: '#10b981', icon: 'activity' },
  { id: 'cat-4', name: 'Reading', color: '#f59e0b', icon: 'book-open' },
  { id: 'cat-5', name: 'Personal', color: '#64748b', icon: 'user' },
];

const generateDemoData = () => {
  const categories: Category[] = defaultCategories;

  const workingHours: WorkingHours[] = Array.from({ length: 7 }).map((_, i) => ({
    dayOfWeek: i,
    start: '08:00',
    end: '18:00',
  }));

  const tasks: Task[] = [];
  const timeEntries: TimeEntry[] = [];
  
  const today = new Date('2026-08-20T12:00:00Z');
  const daysToGenerate = eachDayOfInterval({
    start: subDays(today, 20),
    end: addDays(today, 10),
  });

  daysToGenerate.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isPast = isBefore(day, today);
    const dayOfWeek = day.getDay();

    // English Task (Every day)
    const engTaskId = crypto.randomUUID();
    tasks.push({
      id: engTaskId,
      title: 'Study English Vocabulary',
      description: 'Review 50 new words and grammar exercises.',
      date: dateStr,
      startTime: '08:00',
      endTime: '10:00',
      plannedDuration: 120,
      deadline: `${dateStr}T23:59:00Z`,
      categoryId: 'cat-1',
      priority: 'High',
      status: isPast ? 'Completed' : 'Not Started',
      progress: isPast ? 100 : 0,
      notes: '',
      recurrenceRule: 'None',
      reminderEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (isPast) {
      timeEntries.push({
        id: crypto.randomUUID(),
        taskId: engTaskId,
        startTime: `${dateStr}T08:00:00Z`,
        endTime: `${dateStr}T09:${Math.floor(Math.random() * 40 + 20)}:00Z`,
        duration: Math.floor(Math.random() * 40 + 80),
        createdAt: new Date().toISOString(),
      });
    }

    // Work Tasks (Weekdays)
    if (dayOfWeek > 0 && dayOfWeek < 6) {
      const workTaskId = crypto.randomUUID();
      tasks.push({
        id: workTaskId,
        title: 'Deep Work Session',
        description: 'Focus on project deliverables.',
        date: dateStr,
        startTime: '13:00',
        endTime: '16:00',
        plannedDuration: 180,
        deadline: `${dateStr}T17:00:00Z`,
        categoryId: 'cat-2',
        priority: 'Medium',
        status: isPast ? 'Completed' : (dateStr === format(today, 'yyyy-MM-dd') ? 'In Progress' : 'Not Started'),
        progress: isPast ? 100 : (dateStr === format(today, 'yyyy-MM-dd') ? 50 : 0),
        notes: '',
        recurrenceRule: 'None',
        reminderEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (isPast) {
        timeEntries.push({
          id: crypto.randomUUID(),
          taskId: workTaskId,
          startTime: `${dateStr}T13:00:00Z`,
          endTime: `${dateStr}T15:${Math.floor(Math.random() * 40 + 20)}:00Z`,
          duration: Math.floor(Math.random() * 60 + 120),
          createdAt: new Date().toISOString(),
        });
      }
    }
    
    // Exercise (MWF)
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
       const exTaskId = crypto.randomUUID();
       tasks.push({
        id: exTaskId,
        title: 'Gym Workout',
        description: 'Strength training',
        date: dateStr,
        startTime: '18:00',
        endTime: '19:30',
        plannedDuration: 90,
        deadline: `${dateStr}T20:00:00Z`,
        categoryId: 'cat-3',
        priority: 'Medium',
        status: isPast ? 'Completed' : 'Not Started',
        progress: isPast ? 100 : 0,
        notes: '',
        recurrenceRule: 'None',
        reminderEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      if (isPast) {
        timeEntries.push({
          id: crypto.randomUUID(),
          taskId: exTaskId,
          startTime: `${dateStr}T18:00:00Z`,
          endTime: `${dateStr}T19:30:00Z`,
          duration: 90,
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  return { tasks, categories, timeEntries, workingHours };
};

const calculateDuration = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  return (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: {},
  tasks: [],
      recurringTasks: [],
      categories: [],
      timeEntries: [],
      workingHours: [],
      hasInitialized: false,
      currentTime: Date.now(),
      activeTimer: null,
      setCurrentTime: (time) => set({ currentTime: time }),
      language: 'en',
      isSpecialFeaturesUnlocked: false,
      updateProfileState: (profileUpdates) => set((state) => ({ profile: { ...state.profile, ...profileUpdates } })),
      settings: defaultSettings,
      
      setLanguage: (lang) => {
        set({ language: lang });
        syncFirebase.updateProfile({ language: lang });
      },
      updateSettings: (newSettings) => {
        set((state) => {
          const nextSettings = { ...state.settings, ...newSettings };
          syncFirebase.updateProfile({ settings: nextSettings });
          return { settings: nextSettings };
        });
      },
      updateCategory: (id, updates) => {
        set((state) => {
          const categories = state.categories.map(c => c.id === id ? { ...c, ...updates } : c);
          const updatedCat = categories.find(c => c.id === id);
          if (updatedCat) syncFirebase.setCategory(updatedCat);
          return { categories };
        });
      },
      deleteCategory: (id) => {
        set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
        syncFirebase.deleteCategory(id);
      },
      resetData: (type) => {
        if (type === 'all') {
          set({ profile: {},
  tasks: [], recurringTasks: [], categories: defaultCategories, timeEntries: [], settings: defaultSettings, activeTimer: null, hasInitialized: true, language: 'en', isSpecialFeaturesUnlocked: false });
          syncFirebase.wipeUserData();
          syncFirebase.updateProfile({ settings: defaultSettings, language: 'en' });
        }
      },
      overwriteStore: (data: Partial<AppState>) => set((state) => ({ ...state, ...data, hasInitialized: true })),
      setSpecialFeaturesUnlocked: (unlocked) => set({ isSpecialFeaturesUnlocked: unlocked }),
      clearStoreForLogout: () => set({ isSpecialFeaturesUnlocked: false,  profile: {}, settings: defaultSettings, language: 'en',
  tasks: [], categories: defaultCategories, timeEntries: [], recurringTasks: [], activeTimer: null, hasInitialized: false }),
      importData: (data) => {
        set((state) => ({ ...state, ...data }));
        // Sync imported data to Firebase
        if (data.tasks && Array.isArray(data.tasks)) {
          data.tasks.forEach(t => syncFirebase.setTask(t));
        }
        if (data.recurringTasks && Array.isArray(data.recurringTasks)) {
          data.recurringTasks.forEach(t => syncFirebase.setRecurringTask(t));
        }
        if (data.categories && Array.isArray(data.categories)) {
          data.categories.forEach(c => syncFirebase.setCategory(c));
        }
        if (data.timeEntries && Array.isArray(data.timeEntries)) {
          data.timeEntries.forEach(te => syncFirebase.setTimeEntry(te));
        }
      },


      addTask: (taskData) => {
        const plannedDuration = calculateDuration(taskData.startTime, taskData.endTime);
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          plannedDuration,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        let sideEffects = [];
        set((state) => {
          let newTimeEntries = [...state.timeEntries];
          if (newTask.progress > 0) {
            const actual = (newTask.progress / 100) * Math.max(1, newTask.plannedDuration);
            const now = new Date();
            const newEntry = {
              id: crypto.randomUUID(),
              taskId: newTask.id,
              startTime: now.toISOString(),
              endTime: now.toISOString(),
              duration: actual,
              createdAt: now.toISOString()
            };
            newTimeEntries.push(newEntry);
            sideEffects.push(() => syncFirebase.setTimeEntry(newEntry));
          }
          sideEffects.push(() => syncFirebase.setTask(newTask));
          return { tasks: [...state.tasks, newTask], timeEntries: newTimeEntries };
        });
        sideEffects.forEach(fn => fn());
      },

      updateTask: (id, updates) => {
        let sideEffects = [];
        set((state) => {
          let updatedTask = null;
          let newTimeEntries = [...state.timeEntries];
          
          const tasks = state.tasks.map(t => {
            if (t.id !== id) return t;
            let updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
            
            // Auto-calculate plannedDuration if time changes
            if (updates.startTime !== undefined || updates.endTime !== undefined) {
              updated.plannedDuration = calculateDuration(updated.startTime || t.startTime, updated.endTime || t.endTime);
            }
            
            // --- TIME SYNC LOGIC ---
            const planned = Math.max(1, updated.plannedDuration);
            const actualDuration = newTimeEntries.filter(te => te.taskId === id).reduce((sum, te) => sum + te.duration, 0);
            const computedProgress = Math.min(100, Math.max(0, Math.round((actualDuration / planned) * 100)));
            
            if (updates.progress !== undefined && updates.progress !== t.progress) {
              // User manually edited progress
              const targetActual = (updates.progress / 100) * planned;
              const diff = targetActual - actualDuration;
              if (Math.abs(diff) > 0.1) {
                const now = new Date();
                const newEntry = {
                  id: crypto.randomUUID(),
                  taskId: id,
                  startTime: now.toISOString(),
                  endTime: now.toISOString(),
                  duration: diff,
                  createdAt: now.toISOString()
                };
                newTimeEntries.push(newEntry);
                sideEffects.push(() => syncFirebase.setTimeEntry(newEntry));
              }
            } else if (updates.progress === undefined || updates.progress === t.progress) {
              // Sync progress with actual time entries (e.g. after a timer stopped or plannedDuration changed)
              updated.progress = computedProgress;
            }
            
            // Auto-complete
            if (updated.progress === 100 && t.progress !== 100 && updates.status !== 'Completed') {
              const settings = get().settings;
              if (settings?.completionBehavior === 'ask') {
                if (window.confirm('Task progress reached 100%. Mark as Completed?')) {
                  updated.status = 'Completed';
                }
              } else {
                updated.status = 'Completed';
              }
            } else if (updated.status === 'Completed' && t.status !== 'Completed') {
              updated.progress = 100;
              const diff = planned - actualDuration;
              if (diff > 0.1) {
                const now = new Date();
                const newEntry = {
                  id: crypto.randomUUID(),
                  taskId: id,
                  startTime: now.toISOString(),
                  endTime: now.toISOString(),
                  duration: diff,
                  createdAt: now.toISOString()
                };
                newTimeEntries.push(newEntry);
                sideEffects.push(() => syncFirebase.setTimeEntry(newEntry));
              }
            }
            
            updatedTask = updated;
            return updated;
          });
          
          if (updatedTask) {
             const finalTask = updatedTask;
             sideEffects.push(() => syncFirebase.setTask(finalTask));
          }
          return { tasks, timeEntries: newTimeEntries };
        });
        
        sideEffects.forEach(fn => fn());
      },

      
      addRecurringTask: (taskData) => {
        const plannedDuration = calculateDuration(taskData.startTime, taskData.endTime);
        const newTask = {
          ...taskData,
          id: crypto.randomUUID(),
          plannedDuration,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ recurringTasks: [...state.recurringTasks, newTask] })); syncFirebase.setRecurringTask(newTask);
      },
      updateRecurringTask: (id, updates) => {
        set((state) => {
          let updatedRecurringTask = null;
          const recurringTasks = state.recurringTasks.map(t => {
            if (t.id !== id) return t;
            let updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
            if (updates.startTime !== undefined || updates.endTime !== undefined) {
              updated.plannedDuration = calculateDuration(updated.startTime || t.startTime, updated.endTime || t.endTime);
            }
            updatedRecurringTask = updated;
            return updated;
          });
          if (updatedRecurringTask) syncFirebase.setRecurringTask(updatedRecurringTask);
          return { recurringTasks };
        });
      },
      deleteRecurringTask: (id) => {
        set((state) => ({
          recurringTasks: state.recurringTasks.filter(t => t.id !== id),
        }));
        syncFirebase.deleteRecurringTask(id);
      },

      deleteTask: (id) => {
        set((state) => {
          const timeEntriesToDelete = state.timeEntries.filter(te => te.taskId === id);
          timeEntriesToDelete.forEach(te => syncFirebase.deleteTimeEntry(te.id));
          return {
            tasks: state.tasks.filter(t => t.id !== id),
            timeEntries: state.timeEntries.filter(te => te.taskId !== id),
            activeTimer: state.activeTimer?.taskId === id ? null : state.activeTimer
          };
        });
        syncFirebase.deleteTask(id);
      },

      addCategory: (cat) => {
        const newCat = { ...cat, id: crypto.randomUUID() };
        set((state) => ({
          categories: [...state.categories, newCat]
        }));
        syncFirebase.setCategory(newCat);
      },

      startTimer: (taskId) => {
        const { activeTimer } = get();
        if (activeTimer) {
          get().stopTimer();
        }
        set({
          activeTimer: { taskId, startTime: new Date().toISOString() }
        });
        get().updateTask(taskId, { status: 'In Progress' });
      },

      stopTimer: () => {
        const { activeTimer } = get();
        if (!activeTimer) return;
        
        // Clear active timer immediately to prevent duplicate events
        set({ activeTimer: null });
        
        const endTime = new Date().toISOString();
        const durationMs = new Date(endTime).getTime() - new Date(activeTimer.startTime).getTime();
        const durationMinutes = Math.max(0, durationMs / 60000);
        
        const newEntry: TimeEntry = {
          id: crypto.randomUUID(),
          taskId: activeTimer.taskId,
          startTime: activeTimer.startTime,
          endTime,
          duration: durationMinutes,
          createdAt: new Date().toISOString(),
        };

        const task = get().tasks.find(t => t.id === activeTimer.taskId);
        set((state) => ({
          timeEntries: [...state.timeEntries, newEntry]
        }));
        syncFirebase.setTimeEntry(newEntry);

        if (task) {
          get().updateTask(activeTimer.taskId, task.status !== 'Completed' ? { status: 'Paused' } : {});
        }
      },

      addManualTimeEntry: (taskId, durationMinutes) => {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - durationMinutes * 60000);
        
        const newEntry: TimeEntry = {
          id: crypto.randomUUID(),
          taskId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: durationMinutes,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          timeEntries: [...state.timeEntries, newEntry]
        }));
        syncFirebase.setTimeEntry(newEntry);
        get().updateTask(taskId, {});
      },

      checkOverdueTasks: () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        set((state) => {
          let changed = false;
          const updatedTasks: Task[] = [];
          const tasks = state.tasks.map(t => {
            if (t.status !== 'Completed' && t.status !== 'Cancelled' && t.deadline) {
              const deadlineDate = new Date(t.deadline + 'T00:00:00');
              const deadlineStartOfDay = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
              
              if (today.getTime() > deadlineStartOfDay.getTime() && t.status !== 'Overdue') {
                changed = true;
                const ut = { ...t, status: 'Overdue' as Status };
                updatedTasks.push(ut);
                return ut;
              }
            }
            return t;
          });
          if (changed) {
            updatedTasks.forEach(ut => syncFirebase.setTask(ut));
            return { tasks };
          }
          return {};
        });
      }
    }),
    {
      name: 'productivity-os-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.hasInitialized) {
            if (state.tasks.length === 0 && state.categories.length === 0) {
              const demo = generateDemoData();
              state.tasks = demo.tasks;
              state.categories = demo.categories;
              state.timeEntries = demo.timeEntries;
              state.workingHours = demo.workingHours;
            }
            state.hasInitialized = true;
          }
        }
      },
    }
  )
);
