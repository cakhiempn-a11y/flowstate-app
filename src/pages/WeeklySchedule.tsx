import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useTasks } from '../store/useTasks';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarFilters } from './CalendarPage';
import { useTranslation } from '../i18n/useTranslation';
import { formatTimeString, cn } from '../lib/utils';



function getPriorityLightColor(priority: string) {
  switch (priority) {
    case 'Urgent': return 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400';
    case 'High': return 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400';
    case 'Medium': return 'bg-primary/10 border-primary text-primary';
    case 'Low': return 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400';
    default: return 'bg-muted border-border text-foreground';
  }
}

export default function WeeklySchedule({ filters }: { filters?: CalendarFilters }) {
  const { t, dateLocale, language } = useTranslation();
  const settings = useStore(s => s.settings);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const allTasks = useTasks();
  const tasks = allTasks.filter(taskItem => {
    if (!filters) return true;
    if (filters.categoryId !== 'all' && taskItem.categoryId !== filters.categoryId) return false;
    if (filters.status !== 'all' && taskItem.status !== filters.status) return false;
    if (filters.priority !== 'all' && taskItem.priority !== filters.priority) return false;
    return true;
  });

  const categories = useStore(s => s.categories);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getCategoryColor = (catId: string) => categories.find(c => c.id === catId)?.color || '#94a3b8';

  return (
    <div className="h-full flex flex-col max-w-[1400px] mx-auto pb-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('schedule.weeklyTitle')}</h1>
          <div className="flex items-center bg-card border border-border rounded-lg p-1 shadow-sm">
            <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 hover:bg-muted rounded">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="px-4 py-1 font-semibold text-sm text-foreground min-w-[200px] text-center">
              {format(weekStart, 'MMM d', { locale: dateLocale })} - {format(weekEnd, 'MMM d, yyyy', { locale: dateLocale })}
            </div>
            <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-muted rounded">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())} 
              className="ml-2 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10 rounded uppercase"
            >
              {t('filters.thisWeek')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Header Row */}
        <div className="grid grid-cols-7 border-b border-border bg-background">
          {weekDays.map(day => (
            <div 
              key={day.toISOString()} 
              className={`p-3 text-center border-r border-border last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-primary/10' : ''}`}
            >
              <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{format(day, 'EEE', { locale: dateLocale })}</div>
              <div className={`text-xl font-bold ${isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        {/* Grid Body */}
        <div className="flex-1 grid grid-cols-7 overflow-y-auto">
          {weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = tasks.filter(taskItem => taskItem.date === dateStr && taskItem.status !== 'Skipped').sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            return (
              <div key={dateStr} className="border-r border-border last:border-r-0 p-2 space-y-2 min-h-[500px]">
                {dayTasks.map(task => (
                  <div key={task.id} className={cn("border rounded-lg p-2 text-sm shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer", task.status === "Completed" ? "bg-muted/50 border-muted text-muted-foreground" : getPriorityLightColor(task.priority))}>
                    
                    <div className="pl-2">
                      <div className="font-bold text-current text-xs truncate" title={task.title}>{task.title}</div>
                      <div className="text-[10px] font-medium opacity-80 mt-0.5">{formatTimeString(task.startTime, settings?.timeFormat || '24h', language)} - {formatTimeString(task.endTime, settings?.timeFormat || '24h', language)}</div>
                      {task.status === 'Completed' && (
                         <div className="mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 inline-block px-1 rounded uppercase tracking-wider">{t('status.completed')}</div>
                      )}
                      {task.status === 'Overdue' && (
                         <div className="mt-1 text-[9px] font-bold text-red-700 bg-red-50 inline-block px-1 rounded uppercase tracking-wider">{t('status.overdue')}</div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Empty state clickable area can go here for new task creation */}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
