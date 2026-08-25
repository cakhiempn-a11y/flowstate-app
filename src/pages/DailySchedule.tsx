import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useTasks } from '../store/useTasks';
import { Card } from '../components/ui';
import { format, parseISO, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Plus, Play, Pause } from 'lucide-react';
import { getWorkloadColor, formatDuration, cn } from '../lib/utils';
import { Status, Priority } from '../types';
import TaskModal from '../components/TaskModal';
import { CalendarFilters } from './CalendarPage';
import { useTranslation } from '../i18n/useTranslation';
import { formatTimeString, getPriorityColor } from '../lib/utils';



function getPriorityLightColor(priority: string) {
  switch (priority) {
    case 'Urgent': return 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400';
    case 'High': return 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400';
    case 'Medium': return 'bg-primary/10 border-primary text-primary';
    case 'Low': return 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400';
    default: return 'bg-muted border-border text-foreground';
  }
}

export default function DailySchedule({ filters }: { filters?: CalendarFilters }) {
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
  const startTimer = useStore(s => s.startTimer);
  const stopTimer = useStore(s => s.stopTimer);
  const activeTimer = useStore(s => s.activeTimer);
  const workingHours = useStore(s => s.workingHours);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dayOfWeek = currentDate.getDay();
  const dayWorkingHours = workingHours.find(wh => wh.dayOfWeek === dayOfWeek) || { start: '08:00', end: '18:00' };

  const dayTasks = useMemo(() => {
    return tasks.filter(taskItem => taskItem.date === dateStr && taskItem.status !== 'Skipped').sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, dateStr]);

  const workloadInfo = useMemo(() => {
    const [wStartH, wStartM] = dayWorkingHours.start.split(':').map(Number);
    const [wEndH, wEndM] = dayWorkingHours.end.split(':').map(Number);
    const availableMinutes = (wEndH * 60 + wEndM) - (wStartH * 60 + wStartM);
    
    let scheduledMinutes = 0;
    dayTasks.forEach(taskItem => { scheduledMinutes += taskItem.plannedDuration; });
    
    const percentage = availableMinutes > 0 ? (scheduledMinutes / availableMinutes) * 100 : 0;
    
    return { availableMinutes, scheduledMinutes, percentage };
  }, [dayTasks, dayWorkingHours]);

  const interval = settings?.analytics?.timelineInterval || 60;
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 0; i < 24 * 60; i += interval) {
      const h = Math.floor(i / 60);
      const m = i % 60;
      slots.push({ timeStr: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`, mins: i });
    }
    return slots;
  }, [interval]);

  const getCategoryColor = (catId: string) => categories.find(c => c.id === catId)?.color || '#94a3b8';

  const getStatusStyle = (status: Status) => {
    switch(status) {
      case 'Completed': return 'border-l-4 border-emerald-500 opacity-80';
      case 'In Progress': return 'border-l-4 border-primary shadow-md ring-1 ring-primary/30';
      case 'Overdue': return 'border-l-4 border-red-500';
      default: return 'border-l-4 border-border';
    }
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto pb-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('schedule.dailyTitle')}</h1>
          <div className="flex items-center bg-card border border-border rounded-lg p-1 shadow-sm">
            <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="p-1 hover:bg-muted rounded" title={t('schedule.previousDay')}>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="px-4 py-1 font-semibold text-sm text-foreground min-w-[140px] text-center">
              {format(currentDate, 'PPP', { locale: dateLocale })}
            </div>
            <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-1 hover:bg-muted rounded" title={t('schedule.nextDay')}>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())} 
              className="ml-2 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10 rounded uppercase"
            >
              {t('schedule.today')}
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1.5 rounded text-xs font-bold flex items-center ${getWorkloadColor(workloadInfo.percentage)}`}>
            <span>{workloadInfo.percentage.toFixed(0)}%</span>
            {workloadInfo.percentage > 100 && (
              <span className="ml-2 bg-red-600 text-white px-1.5 py-0.5 rounded-sm">
                !
              </span>
            )}
          </div>
          <button
            onClick={() => { setSelectedTask(null); setModalOpen(true); }}
            className="flex items-center bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t('tasks.new')}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col relative min-h-0">
        {/* Timeline Header */}
        <div className="h-12 border-b border-border flex items-center px-4 bg-background/50 sticky top-0 z-10">
          <div className="w-16 font-bold text-[10px] text-muted-foreground text-right pr-4 uppercase tracking-wider">{t('common.time')}</div>
          <div className="flex-1 font-bold text-sm text-foreground px-4">{t('analytics.tasks')}</div>
        </div>
        
        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto relative p-4 bg-background/30">
          <div className="absolute top-0 left-0 bottom-0 w-16 border-r border-border bg-transparent" />
          
          <div className="relative h-[1440px]"> {/* 24h * 60px */}
            {timeSlots.map((time, index) => (
              <div key={time.timeStr} className="absolute w-full flex" style={{ top: `${index * 60}px`, height: '60px' }}>
                <div className="w-20 text-[10px] font-bold text-muted-foreground text-right pr-4 pt-1">{formatTimeString(time.timeStr, settings?.timeFormat || '24h', language)}</div>
                <div className="flex-1 border-t border-border" />
              </div>
            ))}
            
            {/* Tasks */}
            {dayTasks.map(task => {
              const [sH, sM] = task.startTime.split(':').map(Number);
              const top = (sH * 60) + sM;
              const height = Math.max(30, task.plannedDuration); // min height 30px
              const catColor = getCategoryColor(task.categoryId);
              
              return (
                <div
                  key={task.id}
                  className={cn(`absolute left-[96px] right-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer group transition-all p-3 border-l-4`, task.status === "Completed" ? "bg-muted/50 border-muted text-muted-foreground" : getPriorityLightColor(task.priority))}
                  style={{ top: `${top}px`, height: `${height}px`, zIndex: selectedTask === task.id ? 10 : 1 }}
                  onClick={() => { setSelectedTask(task.id); setModalOpen(true); }}
                >
                  <div className="h-full flex flex-col relative">
                     <div className="flex items-start justify-between">
                       <h4 className={`text-sm font-bold truncate pr-2 ${task.status === "Completed" ? "text-muted-foreground line-through" : "text-current"}`}>{task.title}</h4>
                       {task.status !== 'Completed' && task.progress > 0 && (
                         <span className="text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded">
                           {task.progress}%
                         </span>
                       )}
                     </div>
                     
                     {height >= 45 && (
                       <div className="mt-1 flex items-center gap-2">
                         <span className={`text-xs font-medium opacity-80 ${task.status === 'Completed' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                           {categories.find(c => c.id === task.categoryId)?.name} • {task.startTime} - {task.endTime}
                         </span>
                       </div>
                     )}

                     {/* Hover Actions */}
                     <div className="absolute right-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        {task.status !== 'Completed' && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (activeTimer?.taskId === task.id) {
                                stopTimer();
                                alert(t('timeTracking.recordingStopped'));
                              } else {
                                startTimer(task.id);
                              }
                            }}
                            className={`p-1.5 rounded-md shadow-sm ${activeTimer?.taskId === task.id ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                            title={activeTimer?.taskId === task.id ? t('common.stopTimer') : task.status === 'Paused' ? t('timeTracking.resume') : t('timeTracking.startTimer')}
                          >
                            {activeTimer?.taskId === task.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                        )}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <TaskModal 
          existingTask={selectedTask ? tasks.find(t => t.id === selectedTask) : undefined} isOpen={isModalOpen} 
          onClose={() => setModalOpen(false)} 
        />
      )}
    </div>
  );
}
