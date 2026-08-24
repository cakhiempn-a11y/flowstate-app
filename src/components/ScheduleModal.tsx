import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from './ui';
import { DatePicker } from './DatePicker';
import { TimeRangeInput } from './TimeRangeInput';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../store/useStore';
import { Task } from '../types';
import { differenceInMinutes, parseISO, startOfDay, isSameDay } from 'date-fns';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

export default function ScheduleModal({ isOpen, onClose, task }: ScheduleModalProps) {
  const { t } = useTranslation();
  const updateTask = useStore(state => state.updateTask);
  const settings = useStore(state => state.settings);

  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (newDate && !startTime) {
      const defaultStart = settings?.workingHours?.[new Date(newDate).getDay()]?.start || '09:00';
      setStartTime(defaultStart);
      
      const dur = settings?.taskDefaults?.duration || 60;
      const [h, m] = defaultStart.split(':').map(Number);
      const total = h * 60 + m + dur;
      const eh = Math.floor(total / 60).toString().padStart(2, '0');
      const em = (total % 60).toString().padStart(2, '0');
      setEndTime(`${eh}:${em}`);
    }
  };

  const handleSave = () => {
    if (!date || !startTime || !endTime) return;
    setError(null);

    const scheduledDate = startOfDay(parseISO(date));
    const today = startOfDay(new Date());

    if (scheduledDate < today) {
      setError(t('validation.schedulePastError') || 'Scheduled date must be today or later.');
      return;
    }
    
    if (task.deadline) {
      const deadlineDate = startOfDay(parseISO(task.deadline));
      if (scheduledDate > deadlineDate) {
        setError(t('validation.scheduleAfterDueError') || 'Scheduled date must be between today and the due date.');
        return;
      }
    }
    
    if (isSameDay(scheduledDate, today) && startTime) {
      const now = new Date();
      const [h, m] = startTime.split(':').map(Number);
      const selectedTime = new Date(today);
      selectedTime.setHours(h, m, 0, 0);
      
      const isTimeChanged = task.date !== date || task.startTime !== startTime;
      const bufferTime = new Date(now.getTime() - 5 * 60000);
      if (isTimeChanged && selectedTime < bufferTime) {
        setError(t('validation.startTimePastError') || 'Start time must be now or later.');
        return;
      }
    }

    updateTask(task.id, {
      date,
      startTime,
      endTime
    });
    onClose();
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const duration = calculateDuration();

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">{t('schedule.title') || 'Schedule Task'}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
            {task.deadline && (
              <p className="text-sm text-muted-foreground">
                {t('taskModal.dueDateLabel') || 'Due Date'}: {task.deadline}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-muted-foreground">
                {t('schedule.selectDate') || 'Select Date'}
              </label>
              <DatePicker
                value={date}
                onChange={handleDateChange}
                className="w-full"
                minDate={new Date()}
                maxDate={task.deadline ? parseISO(task.deadline) : undefined}
              />
            </div>

            {date && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-semibold text-muted-foreground">
                  {t('schedule.selectTime') || 'Start Time & Duration'}
                </label>
                <TimeRangeInput
                  startTime={startTime}
                  endTime={endTime}
                  onChange={(start, end) => {
                    setStartTime(start);
                    setEndTime(end);
                  }}
                />
              </div>
            )}
          </div>

          {date && startTime && endTime && (
            <div className="bg-muted p-4 rounded-xl space-y-2 animate-in fade-in">
              <p className="text-sm font-medium text-muted-foreground uppercase">{t('schedule.summary') || 'Scheduled For'}:</p>
              <div className="flex items-center space-x-2 font-semibold">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span>{date}</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                <span>{startTime} - {endTime} ({duration} min)</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end space-x-3 bg-muted/50">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={!date || !startTime || !endTime}
          >
            {t('schedule.confirm') || 'Confirm Schedule'}
          </Button>
        </div>
      </div>
    </div>
  );
}
