#!/bin/bash
cat << 'INNER_EOF' > src/types.ts
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Status = 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled' | 'Overdue';
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
}

export interface WorkingHours {
  dayOfWeek: number; // 0-6 (Sun-Sat)
  start: string; // HH:mm
  end: string; // HH:mm
}

export type Language = 'en' | 'vi' | 'zh' | 'ko';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  workingHours: Record<number, { enabled: boolean; start: string; end: string }>; // 0-6
  defaultTimeSlot: number; // minutes
  weekStartsOn: 0 | 1; // 0 Sunday, 1 Monday
  timeFormat: '12h' | '24h';
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
  };
}

export interface AppState {
  tasks: Task[];
  categories: Category[];
  timeEntries: TimeEntry[];
  workingHours: WorkingHours[]; // Deprecated in favor of settings.workingHours, but keeping for compatibility
  activeTimer: { taskId: string; startTime: string } | null;
  language: Language;
  settings: AppSettings;
  
  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'plannedDuration'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  addManualTimeEntry: (taskId: string, durationMinutes: number) => void;
  checkOverdueTasks: () => void;
  setLanguage: (lang: Language) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetData: (type: 'all' | 'settings' | 'tasks') => void;
  importData: (data: any) => void;
}
INNER_EOF
