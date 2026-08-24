import { DatePicker } from '../components/DatePicker';
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTasks } from '../store/useTasks';
import { CalendarFilters } from './CalendarPage';
import { useTranslation } from '../i18n/useTranslation';
import { formatTimeString } from '../lib/utils';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import { Badge } from '../components/ui';

export default function CustomRangeCalendar({ filters }: { filters?: CalendarFilters }) {
  const { t, dateLocale, language } = useTranslation();
  const settings = useStore(s => s.settings);
  
  const allTasks = useTasks();
  const tasks = allTasks.filter(taskItem => {
    if (!filters) return true;
    if (filters.categoryId !== 'all' && taskItem.categoryId !== filters.categoryId) return false;
    if (filters.status !== 'all' && taskItem.status !== filters.status) return false;
    if (filters.priority !== 'all' && taskItem.priority !== filters.priority) return false;
    return true;
  });
  const categories = useStore(s => s.categories);
  const updateTask = useStore(s => s.updateTask);
  const deleteTask = useStore(s => s.deleteTask);
  const startTimer = useStore(s => s.startTimer);
  const activeTimer = useStore(s => s.activeTimer);
  
  const getCategoryColor = (catId: string) => categories.find(c => c.id === catId)?.color || '#94a3b8';
  
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [endDate, setEndDate] = useState(addDays(endOfDay(new Date()), 6));
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.date);
    return isWithinInterval(taskDate, { start: startDate, end: endDate });
  }).sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  const getTranslatedStatus = (status: string) => {
    const key = status.replace(' ', '').toLowerCase();
    return t(`status.${key}`) || status;
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto pb-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('schedule.customView') || 'Custom Range'}</h1>
          <div className="flex items-center bg-card border border-border rounded-lg p-1 shadow-sm">
            <DatePicker
              value={format(startDate, 'yyyy-MM-dd')}
              onChange={val => setStartDate(startOfDay(new Date(val)))}
              className="px-3 py-1 font-semibold text-sm text-foreground bg-transparent outline-none cursor-pointer border-none"
            />
            <span className="text-muted-foreground font-bold px-2">→</span>
            <DatePicker
              value={format(endDate, 'yyyy-MM-dd')}
              onChange={val => setEndDate(endOfDay(new Date(val)))}
              className="px-3 py-1 font-semibold text-sm text-foreground bg-transparent outline-none cursor-pointer border-none"
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col p-6 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
            <CalendarIcon className="w-16 h-16 text-slate-200" />
            <div className="text-lg font-bold">{t('tasks.noTasks') || 'No tasks found in this range'}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map(task => {
              const isTimerActive = activeTimer?.taskId === task.id;
              return (
                <div 
                  key={task.id} 
                  className="bg-background border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => setSelectedTask(task.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-12 rounded-full" style={{ backgroundColor: getCategoryColor(task.categoryId) }} />
                    <div>
                      <div className="font-bold text-foreground text-lg">{task.title}</div>
                      <div className="text-sm font-semibold text-muted-foreground mt-1 flex items-center space-x-3">
                        <span className="flex items-center"><CalendarIcon className="w-3.5 h-3.5 mr-1" /> {format(parseISO(task.date), 'PPP', { locale: dateLocale })}</span>
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {formatTimeString(task.startTime, settings?.timeFormat || '24h', language)} - {formatTimeString(task.endTime, settings?.timeFormat || '24h', language)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={task.status === 'Completed' ? 'success' : task.status === 'Overdue' ? 'danger' : task.status === 'In Progress' ? 'info' : task.status === 'Paused' ? 'warning' : 'default'}>
                      {getTranslatedStatus(task.status)}
                    </Badge>
                    
                    <div className="flex gap-2">
                       {task.status !== 'Completed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: 'Completed', progress: 100 }); }}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                       )}
                       <button
                         onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this task?')) deleteTask(task.id); }}
                         className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {selectedTask && (
        <TaskModal existingTask={selectedTask ? tasks.find(t => t.id === selectedTask) : undefined} isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
