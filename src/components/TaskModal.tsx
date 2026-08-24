import { DatePicker } from './DatePicker';
import { Select } from './ui';
import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Trash2, RepeatIcon, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { Button } from './ui';
import { Task, Priority, Status, RecurrenceRule, RecurringTask } from '../types';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../store/useStore';
import { differenceInMinutes, parseISO, startOfDay, isSameDay } from 'date-fns';
import { cn } from '../lib/utils';
import { TimeRangeInput } from './TimeRangeInput';
import { RecurrenceBuilder } from './RecurrenceBuilder';
import { useTasks } from '../store/useTasks';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTask?: Task;
  defaultDate?: string;
  defaultTime?: string;
  isUnscheduledContext?: boolean;
  modalAction?: 'create' | 'edit' | 'schedule';
}

export default function TaskModal({ isOpen, onClose, existingTask, defaultDate, defaultTime, isUnscheduledContext, modalAction }: TaskModalProps) {
  const { t } = useTranslation();
  
  // Store actions
  const addTask = useStore(state => state.addTask);
  const updateTask = useStore(state => state.updateTask);
  const deleteTask = useStore(state => state.deleteTask);
  const addRecurringTask = useStore(state => state.addRecurringTask);
  const updateRecurringTask = useStore(state => state.updateRecurringTask);
  const deleteRecurringTask = useStore(state => state.deleteRecurringTask);
  const addManualTimeEntry = useStore(state => state.addManualTimeEntry);
  const startTimer = useStore(state => state.startTimer);
  const stopTimer = useStore(state => state.stopTimer);
  const activeTimer = useStore(state => state.activeTimer);
  const categories = useStore(state => state.categories);
  const settings = useStore(state => state.settings);
  const recurringTasks = useStore(s => s.recurringTasks);
  const allTasks = useTasks();

  const isTimerActive = activeTimer?.taskId === existingTask?.id;
  const isUnscheduledFlow = (modalAction === 'create' && defaultDate === "") || (modalAction === 'edit' && existingTask && !existingTask.date);

  const getParentRecurringTask = () => {
    if (existingTask?.recurringTaskId) {
      return recurringTasks?.find(rt => rt.id === existingTask.recurringTaskId);
    }
    return null;
  };

  const parentRecurringTask = getParentRecurringTask();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: defaultDate !== undefined ? defaultDate : new Date().toISOString().split('T')[0],
    startTime: defaultTime !== undefined ? defaultTime : (settings?.workingHours?.[new Date().getDay()]?.start || '09:00'),
    endTime: '10:00',
    categoryId: '',
    priority: settings?.taskDefaults?.priority || 'Medium' as Priority,
    status: settings?.taskDefaults?.status || 'Not Started' as Status,
    progress: 0,
    deadline: null as string | null,
    recurrenceRule: null as RecurrenceRule | null,
  });

  const [manualTime, setManualTime] = useState('');
  
  // Update Scope state
  const [showUpdateScope, setShowUpdateScope] = useState(false);
  const [showDeleteScope, setShowDeleteScope] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConflictConfirmation, setShowConflictConfirmation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (existingTask) {
      setFormData({
        title: existingTask.title,
        description: existingTask.description || '',
        date: existingTask.date,
        startTime: existingTask.startTime,
        endTime: existingTask.endTime,
        categoryId: existingTask.categoryId,
        priority: existingTask.priority,
        status: existingTask.status,
        progress: existingTask.progress,
        deadline: existingTask.deadline || null,
        recurrenceRule: parentRecurringTask?.recurrenceRule || null,
      });
    } else {
      let startTime = defaultTime !== undefined ? defaultTime : '09:00';
      if (settings?.workingHours && defaultTime === undefined) {
        const d = new Date(defaultDate ? defaultDate : new Date());
        const wh = settings.workingHours[d.getDay()];
        if (wh && wh.enabled) {
          startTime = wh.start;
        }
      }
      const dur = settings?.taskDefaults?.duration || 60;
      let eh = '';
      let em = '';
      if (startTime) {
        const [h, m] = startTime.split(':').map(Number);
        const total = h * 60 + m + dur;
        eh = Math.floor(total / 60).toString().padStart(2, '0');
        em = (total % 60).toString().padStart(2, '0');
      }
      
      setFormData({
        title: '',
        description: '',
        date: defaultDate !== undefined ? defaultDate : new Date().toISOString().split('T')[0],
        startTime: startTime,
        endTime: startTime ? `${eh}:${em}` : '',
        categoryId: settings?.taskDefaults?.categoryId || (categories.length > 0 ? categories[0].id : ''),
        priority: settings?.taskDefaults?.priority || 'Medium',
        status: isUnscheduledContext ? 'Not Started' : (settings?.taskDefaults?.status || 'Not Started'),
        progress: 0,
        deadline: null,
        recurrenceRule: null,
      });
    }
  }, [existingTask, defaultDate, defaultTime, settings, categories, parentRecurringTask]);

  if (!isOpen) return null;

  // Find conflicts
  const getConflictingTasks = () => {
    if (!formData.date || !formData.startTime || !formData.endTime || isUnscheduledFlow) return [];
    const startMins = formData.startTime.split(':').reduce((acc, val, i) => acc + (i === 0 ? parseInt(val)*60 : parseInt(val)), 0);
    const endMins = formData.endTime.split(':').reduce((acc, val, i) => acc + (i === 0 ? parseInt(val)*60 : parseInt(val)), 0);
    
    return allTasks.filter(t => {
      if (t.id === existingTask?.id) return false;
      if (t.date !== formData.date) return false;
      if (!t.startTime || !t.endTime) return false; // Must be scheduled
      if (t.status === 'Completed' || t.status === 'Skipped') return false; // History doesn't conflict
      const ts = t.startTime.split(':').reduce((acc, val, i) => acc + (i === 0 ? parseInt(val)*60 : parseInt(val)), 0);
      const te = t.endTime.split(':').reduce((acc, val, i) => acc + (i === 0 ? parseInt(val)*60 : parseInt(val)), 0);
      return Math.max(startMins, ts) < Math.min(endMins, te);
    });
  };

  const conflictingTasks = getConflictingTasks();

  const handleSave = (e?: React.FormEvent, force: boolean = false) => {
    if (e) e.preventDefault();
    setError(null);
    
    const today = startOfDay(new Date());
    
    // Deadline validation
    if (formData.deadline) {
      const deadlineDate = startOfDay(parseISO(formData.deadline));
      const isNewTask = !existingTask;
      const isDeadlineChanged = existingTask && existingTask.deadline !== formData.deadline;

      if ((isNewTask || isDeadlineChanged) && deadlineDate < today) {
        setError(t('validation.dueDatePastError') || 'Due date cannot be before today.');
        return;
      }
      
      if (existingTask && isDeadlineChanged && existingTask.date) {
        const scheduledDate = startOfDay(parseISO(existingTask.date));
        if (scheduledDate > deadlineDate) {
          setError(t('validation.dueDateBeforeScheduledError') || 'The new due date cannot be earlier than the current scheduled date. Reschedule the task first.');
          return;
        }
      }
    }
    
    // Scheduled Date validation (only for new/edited schedule)
    if (formData.date && !isUnscheduledContext) {
      const scheduledDate = startOfDay(parseISO(formData.date));
      const isNewTask = !existingTask;
      const isDateChanged = existingTask && existingTask.date !== formData.date;
      
      if ((isNewTask || isDateChanged) && scheduledDate < today) {
        setError(t('validation.schedulePastError') || 'Scheduled date must be today or later.');
        return;
      }
      
      if (formData.deadline) {
        const deadlineDate = startOfDay(parseISO(formData.deadline));
        if (scheduledDate > deadlineDate) {
          setError(t('validation.scheduleAfterDueError') || 'Scheduled date must be between today and the due date.');
          return;
        }
      }
      
      // Start time validation for today
      if (isSameDay(scheduledDate, today) && formData.startTime) {
        const now = new Date();
        const [h, m] = formData.startTime.split(':').map(Number);
        const selectedTime = new Date(today);
        selectedTime.setHours(h, m, 0, 0);
        
        // Let's add a small buffer (e.g. 5 minutes) to avoid rejecting immediate schedules
        const isTimeChanged = !existingTask || existingTask.date !== formData.date || existingTask.startTime !== formData.startTime;
        const bufferTime = new Date(now.getTime() - 5 * 60000);
        if (isTimeChanged && selectedTime < bufferTime) {
          setError(t('validation.startTimePastError') || 'Start time must be now or later.');
          return;
        }
      }
    }

    
    if (conflictingTasks.length > 0 && !force && !isUnscheduledContext) {
      setShowConflictConfirmation(true);
      return;
    }
    
    if (force && conflictingTasks.length > 0) {
      // Unschedule conflicting tasks safely
      conflictingTasks.forEach(ct => {
        const isGenerated = !useStore.getState().tasks.some(t => t.id === ct.id);
        if (isGenerated && ct.recurringTaskId) {
          addTask({
            title: ct.title,
            description: ct.description || '',
            categoryId: ct.categoryId,
            priority: ct.priority,
            status: ct.status,
            progress: ct.progress,
            deadline: ct.deadline,
            date: '', // Unscheduled
            startTime: '',
            endTime: '',
            recurringTaskId: ct.recurringTaskId,
            originalDate: ct.originalDate || ct.date,
            recurrenceRule: 'None' as any,
            notes: ct.notes || '',
            reminderEnabled: ct.reminderEnabled || false
          });
        } else {
          updateTask(ct.id, { date: '', startTime: '', endTime: '' });
        }
      });
    }

    // If it's modifying a recurring task

    if (existingTask?.recurringTaskId || parentRecurringTask) {
      setShowUpdateScope(true);
      return;
    }

    // Save logic for new or normal tasks
    if (formData.recurrenceRule) {
      addRecurringTask({
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        priority: formData.priority,
        startTime: formData.startTime,
        endTime: formData.endTime,
        startDate: formData.date,
        recurrenceRule: formData.recurrenceRule,
        notes: '',
        reminderEnabled: false
      });
    } else if (existingTask) {
      updateTask(existingTask.id, {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        categoryId: formData.categoryId,
        priority: formData.priority,
        status: formData.status,
        progress: formData.progress,
        deadline: formData.deadline,
      });
    } else {
      addTask({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        categoryId: formData.categoryId,
        priority: formData.priority,
        status: formData.status,
        progress: formData.progress,
        deadline: formData.deadline,
        notes: '',
        recurrenceRule: 'None',
        reminderEnabled: false,
      });
    }
    onClose();
  };

  const handleUpdateScope = (scope: 'this' | 'future' | 'all') => {
    if (!existingTask || !parentRecurringTask) return;

    if (scope === 'this') {
      // Just create/update an exception
      // If it already exists in tasks (it has an ID that doesn't include _ like generated ones, or it is in the store)
      // Actually generated occurrences have IDs like `rtId_YYYY-MM-DD`.
      const isGenerated = !useStore.getState().tasks.some(t => t.id === existingTask.id);
      
      if (isGenerated) {
        addTask({
          title: formData.title,
          description: formData.description,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          categoryId: formData.categoryId,
          priority: formData.priority,
          status: formData.status,
          progress: formData.progress,
        deadline: formData.deadline,
          notes: '',
          recurrenceRule: 'None',
          reminderEnabled: false,
          recurringTaskId: parentRecurringTask.id,
          originalDate: existingTask.originalDate || existingTask.date
        });
      } else {
        updateTask(existingTask.id, {
          title: formData.title,
          description: formData.description,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          categoryId: formData.categoryId,
          priority: formData.priority,
          status: formData.status,
          progress: formData.progress,
        deadline: formData.deadline,
        });
      }
    } else if (scope === 'future') {
      // End the current recurring task yesterday
      const yesterday = new Date(existingTask.originalDate || existingTask.date);
      yesterday.setDate(yesterday.getDate() - 1);
      
      updateRecurringTask(parentRecurringTask.id, {
        recurrenceRule: {
          ...parentRecurringTask.recurrenceRule,
          endType: 'until',
          endDate: yesterday.toISOString().split('T')[0]
        }
      });

      // Create new recurring task
      addRecurringTask({
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        priority: formData.priority,
        startTime: formData.startTime,
        endTime: formData.endTime,
        startDate: formData.date,
        recurrenceRule: formData.recurrenceRule || parentRecurringTask.recurrenceRule,
        notes: '',
        reminderEnabled: false
      });
    } else if (scope === 'all') {
      updateRecurringTask(parentRecurringTask.id, {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        priority: formData.priority,
        startTime: formData.startTime,
        endTime: formData.endTime,
        recurrenceRule: formData.recurrenceRule || parentRecurringTask.recurrenceRule,
      });
    }
    
    setShowUpdateScope(false);
    onClose();
  };

  const handleDeleteScope = (scope: 'this' | 'future' | 'all') => {
    if (!existingTask || !parentRecurringTask) return;

    if (scope === 'this') {
      const isGenerated = !useStore.getState().tasks.some(t => t.id === existingTask.id);
      if (isGenerated) {
        // Add skipped exception
        const { id: _id, createdAt: _ca, updatedAt: _ua, plannedDuration: _pd, ...rest } = existingTask;
        addTask({
          ...rest,
 // real ID
          status: 'Skipped' as any, // 'Skipped' might need to be explicitly cast if TS complains, but we added it to types
          recurringTaskId: parentRecurringTask.id,
          originalDate: existingTask.originalDate || existingTask.date,
          recurrenceRule: 'None'
        });
      } else {
        deleteTask(existingTask.id);
        // Also add skipped exception so it doesn't regenerate?
        const { id: _id, createdAt: _ca, updatedAt: _ua, plannedDuration: _pd, ...rest } = existingTask;
        addTask({
          ...rest,
          date: existingTask.originalDate || existingTask.date,
          status: 'Skipped' as any,
          recurringTaskId: parentRecurringTask.id,
          originalDate: existingTask.originalDate || existingTask.date,
          recurrenceRule: 'None'
        });
      }
    } else if (scope === 'future') {
      const yesterday = new Date(existingTask.originalDate || existingTask.date);
      yesterday.setDate(yesterday.getDate() - 1);
      
      updateRecurringTask(parentRecurringTask.id, {
        recurrenceRule: {
          ...parentRecurringTask.recurrenceRule,
          endType: 'until',
          endDate: yesterday.toISOString().split('T')[0]
        }
      });
    } else if (scope === 'all') {
      deleteRecurringTask(parentRecurringTask.id);
      // Optional: Delete all exceptions
      useStore.getState().tasks.filter(t => t.recurringTaskId === parentRecurringTask.id).forEach(t => {
        deleteTask(t.id);
      });
    }
    
    setShowDeleteScope(false);
    onClose();
  };

  const handleManualTimeAdd = () => {
    const mins = parseInt(manualTime);
    if (!isNaN(mins) && mins > 0 && existingTask) {
      addManualTimeEntry(existingTask.id, mins);
      setManualTime('');
    }
  };

  // Scopes rendering
  if (showUpdateScope) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-background rounded-2xl w-full max-w-md shadow-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-bold">{t('recurrence.editRecurring') || 'Edit Recurring Task'}</h2>
          <p className="text-sm text-muted-foreground">{t('recurrence.editPrompt') || 'What would you like to change?'}</p>
          <div className="space-y-2">
            <Button className="w-full justify-start" variant="outline" onClick={() => handleUpdateScope('this')}>
              {t('recurrence.thisOccurrence') || 'This occurrence only'}
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => handleUpdateScope('future')}>
              {t('recurrence.thisAndFuture') || 'This and future occurrences'}
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => handleUpdateScope('all')}>
              {t('recurrence.allOccurrences') || 'All occurrences'}
            </Button>
          </div>
          <div className="pt-2 flex justify-end">
             <Button variant="ghost" onClick={() => setShowUpdateScope(false)}>{t('common.cancel') || 'Cancel'}</Button>
          </div>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-lg p-6 space-y-4">
          <h2 className="text-lg font-bold">{t('taskModal.deleteConfirm')}</h2>
          <div className="flex space-x-2 pt-2">
            <Button className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" variant="outline" onClick={() => {
              if (existingTask?.recurringTaskId) {
                const parentId = existingTask.recurringTaskId;
                const { id: _id, createdAt: _ca, updatedAt: _ua, plannedDuration: _pd, ...rest } = existingTask;
                deleteTask(existingTask.id);
                addTask({
                  ...rest,
                  date: existingTask.originalDate || existingTask.date,
                  status: 'Skipped' as any,
                  recurringTaskId: parentId,
                  originalDate: existingTask.originalDate || existingTask.date,
                  recurrenceRule: 'None'
                });
              } else {
                deleteTask(existingTask!.id);
              }
              setShowDeleteConfirm(false);
              onClose();
            }}>
              {t('common.delete') || 'Delete'}
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showDeleteScope) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-background rounded-2xl w-full max-w-md shadow-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-bold">{t('recurrence.deleteRecurring') || 'Delete Recurring Task'}</h2>
          <div className="space-y-2">
            <Button className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" variant="outline" onClick={() => handleDeleteScope('this')}>
              {t('recurrence.deleteThis') || 'Delete this occurrence only'}
            </Button>
            <Button className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" variant="outline" onClick={() => handleDeleteScope('future')}>
              {t('recurrence.deleteFuture') || 'Delete this and future occurrences'}
            </Button>
            <Button className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" variant="outline" onClick={() => handleDeleteScope('all')}>
              {t('recurrence.deleteAll') || 'Delete all occurrences'}
            </Button>
          </div>
          <div className="pt-2 flex justify-end">
             <Button variant="ghost" onClick={() => setShowDeleteScope(false)}>{t('common.cancel') || 'Cancel'}</Button>
          </div>
        </div>
      </div>
    );
  }


  if (showConflictConfirmation) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card text-card-foreground shadow-xl rounded-2xl w-full max-w-lg overflow-hidden border border-border flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center bg-red-50/50">
            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('validation.scheduleConflict')}
            </h2>
          </div>
          <div className="p-6">
            <p className="font-semibold mb-4 text-sm text-foreground">
              {t('validation.newTaskWillBeScheduled') || 'Công việc mới sẽ được xếp lịch.'} 
            </p>
            <p className="mb-2 text-sm text-muted-foreground">{t('validation.unscheduleWarning') || 'Các công việc sau sẽ được chuyển về Công việc chưa lên lịch:'}</p>
            <ul className="list-disc pl-5 space-y-1 mb-6 text-sm font-medium text-foreground">
              {conflictingTasks.map(ct => (
                <li key={ct.id}>
                  <span className="font-bold">{ct.title}</span> ({ct.startTime} - {ct.endTime})
                </li>
              ))}
            </ul>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowConflictConfirmation(false)}>{t('common.cancel') || 'Cancel'}</Button>
              <Button variant="primary" className="bg-red-600 hover:bg-red-700 text-white" onClick={(e) => handleSave(e as any, true)}>
                {t('validation.scheduleAnyway') || 'Schedule anyway'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl border border-border overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {existingTask ? t('taskModal.editTitle') : t('taskModal.newTitle')}
          </h2>
          <button onClick={onClose} title={t('common.cancel') || 'Cancel'} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}
          {conflictingTasks.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex flex-col gap-1">
              <div className="font-semibold flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {t('validation.scheduleConflict')}
              </div>
              <div className="text-xs ml-6 opacity-90">
                {t('validation.conflictWith')}<br />
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  {conflictingTasks.map(ct => (
                    <li key={ct.id}>
                      <span className="font-bold">{ct.title}</span> ({ct.startTime} - {ct.endTime})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <form id="task-form" onSubmit={handleSave} className="space-y-5">
            <div>
              <input
                autoFocus
                required
                type="text"
                placeholder={t('taskModal.titlePlaceholder')}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-transparent text-xl font-bold border-none outline-none placeholder:text-muted-foreground/50 px-0 focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isUnscheduledFlow ? (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('taskModal.dueDateLabel') || 'Due Date'}</label>
                  {formData.deadline && (
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, deadline: null })}
                      className="text-[10px] text-muted-foreground hover:text-red-500 uppercase"
                    >
                      {t('common.clear') || 'Clear'}
                    </button>
                  )}
                </div>
                <DatePicker
                  value={formData.deadline || ''}
                  onChange={date => setFormData({ ...formData, deadline: date })}
                  className="block w-full font-semibold px-3 py-2"
                  minDate={new Date()}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('taskModal.dateLabel')}</label>
                  {formData.date && !isUnscheduledFlow && (
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, date: '', startTime: '', endTime: '' })}
                      className="text-[10px] text-muted-foreground hover:text-red-500 uppercase"
                    >
                      {t('common.clear') || 'Clear'}
                    </button>
                  )}
                </div>
                <DatePicker
                  value={formData.date}
                  onChange={date => {
                    const defaultStart = settings?.workingHours?.[new Date().getDay()]?.start || '09:00';
                    setFormData({ 
                      ...formData, 
                      date,
                      startTime: formData.startTime || defaultStart,
                      endTime: formData.endTime || '10:00'
                    });
                  }}
                  className="block w-full font-semibold px-3 py-2"
                  minDate={new Date()}
                  maxDate={formData.deadline ? parseISO(formData.deadline) : undefined}
                />
              </div>
            )}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('taskModal.categoryLabel')}</label>
                <Select
                  value={formData.categoryId}
                  onChange={(value) => setFormData({ ...formData, categoryId: value })}
                  className="w-full"
                  options={[
                    { value: "", label: t('common.category') || 'Select category' },
                    ...categories.filter(c => !c.archived || c.id === formData.categoryId).map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
              </div>
            </div>

            {formData.date && !isUnscheduledFlow && (
              <TimeRangeInput 
                startTime={formData.startTime}
                endTime={formData.endTime}
                onChange={(start, end) => setFormData({ ...formData, startTime: start, endTime: end })}
              />
            )}

            {!isUnscheduledFlow && !existingTask?.recurringTaskId && (
              <RecurrenceBuilder 
                rule={formData.recurrenceRule}
                onChange={(rule) => setFormData({ ...formData, recurrenceRule: rule })}
                startDate={formData.date}
              />
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('taskModal.priorityLabel')}</label>
                <Select
                  value={formData.priority}
                  onChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                  className="w-full"
                  options={[
                    { value: "Low", label: t('priority.low') },
                    { value: "Medium", label: t('priority.medium') },
                    { value: "High", label: t('priority.high') },
                    { value: "Urgent", label: t('priority.urgent') }
                  ]}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('taskModal.statusLabel')}</label>
                <Select
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as Status })}
                  className="w-full"
                  options={[
                    { value: "Not Started", label: t('status.notStarted') },
                    { value: "In Progress", label: t('status.inProgress') },
                    { value: "Completed", label: t('status.completed') },
                    { value: "Cancelled", label: t('status.cancelled') },
                    ...(formData.status === 'Skipped' ? [{ value: 'Skipped', label: t('status.skipped') || 'Skipped' }] : [])
                  ]}
                />
              </div>
              {!isUnscheduledFlow && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">{t('taskModal.progress')} ({formData.progress}%)</label>
                <input
                  type="range"
                  min="0" max="100" step="25"
                  value={formData.progress}
                  onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('taskModal.descLabel')}</label>
              <textarea
                rows={3}
                placeholder={t('taskModal.descriptionPlaceholder') || 'Add notes...'}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="block w-full text-sm font-medium bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          </form>

          {existingTask && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">{t('timeTracking.timeEntry')}</h3>
              
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  onClick={() => {
                    if (isTimerActive) {
                      stopTimer();
                      alert(t('timeTracking.recordingStopped'));
                    } else {
                      startTimer(existingTask.id);
                    }
                  }}
                  disabled={existingTask.status === 'Completed'}
                  className="flex-1"
                  variant={isTimerActive ? "danger" : "primary"}
                >
                  {isTimerActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isTimerActive ? t('common.stopTimer') : existingTask.status === 'Paused' ? t('timeTracking.resume') : t('timeTracking.startTimer')}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Manual tracking (minutes)"
                  value={manualTime}
                  onChange={e => setManualTime(e.target.value)}
                  className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button type="button" variant="secondary" onClick={handleManualTimeAdd}>
                  +
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center">
          {existingTask ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (parentRecurringTask && !isUnscheduledContext) {
                    setShowDeleteScope(true);
                  } else {
                    setShowDeleteConfirm(true);
                  }
                }}
                className="px-3"
                title={t('taskModal.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              
              {!parentRecurringTask && (
                 <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                       // Convert to recurring
                       setFormData({
                         ...formData,
                         recurrenceRule: { frequency: 'daily', interval: 1, endType: 'never' }
                       });
                       // When user saves, we delete existing and create recurring?
                       // Or just create recurring and the original continues?
                       // Safer to just allow them to set the rule, and handleSave converts it.
                       // Let's just set the UI to show RecurrenceBuilder.
                    }}
                    title={t('recurrence.makeRecurring') || 'Make Recurring'}
                 >
                    <RepeatIcon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{t('recurrence.makeRecurring') || 'Make Recurring'}</span>
                 </Button>
              )}
              {parentRecurringTask && formData.status !== 'Skipped' && (
                 <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                       handleDeleteScope('this'); // "Skip" is effectively skipping this occurrence
                    }}
                 >
                    {t('recurrence.skip') || 'Skip this occurrence'}
                 </Button>
              )}
            </div>
          ) : <div></div>}
          
          <div className="space-x-2">
            <Button type="button" variant="ghost" onClick={onClose}>{t('taskModal.cancel')}</Button>
            <Button type="submit" form="task-form">{existingTask ? t('taskModal.update') : t('taskModal.save')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
