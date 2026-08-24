export interface UserProfile {
  avatarUrl?: string;
  avatarType?: string;
  [key: string]: any;
}
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Status = 'Not Started' | 'In Progress' | 'Paused' | 'Completed' | 'Cancelled' | 'Overdue' | 'Skipped';
export type Recurrence = 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  archived?: boolean;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string; // ISO string
  endTime: string | null; // ISO string, null if currently running
  duration: number; // in minutes
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  plannedDuration: number; // in minutes
  deadline: string | null; // ISO
  categoryId: string;
  priority: Priority;
  status: Status;
  progress: number; // 0-100
  notes: string;
  recurrenceRule: Recurrence;
  reminderEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  recurringTaskId?: string;
  originalDate?: string;
}

export interface WorkingHours {
  dayOfWeek: number; // 0-6 (Sun-Sat)
  start: string; // HH:mm
  end: string; // HH:mm
}

export type Language = 'en' | 'vi' | 'zh' | 'ko';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system' | 'cute' | 'pink';
  loginWelcomeImage?: string | null;
  workingHours: Record<number, { enabled: boolean; start: string; end: string }>; // 0-6
  defaultTimeSlot: number; // minutes
  weekStartsOn: 0 | 1; // 0 Sunday, 1 Monday
  timeFormat: '12h' | '24h';
  taskDurationPresets?: number[];
  taskDefaults: {
    priority: Priority;
    status: Status;
    duration: number; // minutes
    categoryId: string | null;
  };
  completionBehavior: 'auto' | 'ask';
  notifications: {
    taskReminders: boolean;
    reminderTime: number; // minutes before
    overdueAlerts: boolean;
    dailySummary: boolean;
    dailySummaryTime: string; // HH:mm
  };
  analytics: {
    efficiencyCalculation: string;
    workloadHighThreshold: number; // percentage
    workloadOverloadThreshold: number; // percentage
    enabledWidgets: string[];
    timelineInterval: number;
    showInsightDescriptions: boolean;
    enabledInsights: string[];
  };
}

export interface AppState {
  profile?: UserProfile;
  hasInitialized?: boolean;
  currentTime?: number;
  tasks: Task[];
  recurringTasks: RecurringTask[];
  categories: Category[];
  timeEntries: TimeEntry[];
  workingHours: WorkingHours[]; // Deprecated in favor of settings.workingHours, but keeping for compatibility
  activeTimer: { taskId: string; startTime: string } | null;
  setCurrentTime: (time: number) => void;
  language: Language;
  isSpecialFeaturesUnlocked: boolean;
  setSpecialFeaturesUnlocked: (unlocked: boolean) => void;
  settings: AppSettings;
  
  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'plannedDuration'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addRecurringTask: (task: Omit<RecurringTask, 'id' | 'createdAt' | 'updatedAt' | 'plannedDuration'>) => void;
  updateRecurringTask: (id: string, task: Partial<RecurringTask>) => void;
  deleteRecurringTask: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  addManualTimeEntry: (taskId: string, durationMinutes: number) => void;
  checkOverdueTasks: () => void;
  setLanguage: (lang: Language) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetData: (type: 'all') => void;
  overwriteStore: (data: Partial<AppState>) => void;
  clearStoreForLogout: () => void;
  updateProfileState: (profile: Partial<UserProfile>) => void;
  importData: (data: any) => void;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0-6
  dayOfMonth?: number; // 1-31
  weekOfMonth?: number; // 1-5, -1
  dayOfWeek?: number; // 0-6
  endType: 'never' | 'until' | 'count';
  endDate?: string;
  count?: number;
}

export interface RecurringTask extends Omit<Task, 'date' | 'id' | 'recurrenceRule' | 'status' | 'progress' | 'deadline'> {
  id: string;
  startDate: string;
  recurrenceRule: RecurrenceRule;
}
