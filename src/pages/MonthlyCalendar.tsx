import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTasks } from '../store/useTasks';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getHeatmapColor } from '../lib/utils';
import { CalendarFilters } from './CalendarPage';
import { useTranslation } from '../i18n/useTranslation';

export default function MonthlyCalendar({ filters }: { filters?: CalendarFilters }) {
  const { t, dateLocale } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const allTasks = useTasks();
  const tasks = allTasks.filter(taskItem => {
    if (!filters) return true;
    if (filters.categoryId !== 'all' && taskItem.categoryId !== filters.categoryId) return false;
    if (filters.status !== 'all' && taskItem.status !== filters.status) return false;
    if (filters.priority !== 'all' && taskItem.priority !== filters.priority) return false;
    return true;
  });

  const timeEntries = useStore(s => s.timeEntries);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDaysHeaders = [
    t('schedule.monday'), t('schedule.tuesday'), t('schedule.wednesday'), 
    t('schedule.thursday'), t('schedule.friday'), t('schedule.saturday'), t('schedule.sunday')
  ];

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto pb-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('schedule.monthlyTitle')}</h1>
          <div className="flex items-center bg-card border border-border rounded-lg p-1 shadow-sm">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-muted rounded" title={t('schedule.previousMonth')}>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="px-4 py-1 font-semibold text-sm text-foreground min-w-[160px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
            </div>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-muted rounded" title={t('schedule.nextMonth')}>
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
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-border bg-background">
          {weekDaysHeaders.map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-bold uppercase text-muted-foreground border-r border-border last:border-r-0 truncate px-1">
              {day.substring(0, 3)}
            </div>
          ))}
        </div>
        
        {/* Grid body */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-auto">
          {calendarDays.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = tasks.filter(taskItem => taskItem.date === dateStr && taskItem.status !== 'Skipped');
            
            // Calculate workload heatmap for visual indicator
            let scheduledMinutes = 0;
            dayTasks.forEach(taskItem => { scheduledMinutes += taskItem.plannedDuration; });
            const workloadPercentage = Math.min(100, (scheduledMinutes / 480) * 100); // Assumes 8h available
            
            const completedCount = dayTasks.filter(taskItem => taskItem.status === 'Completed').length;
            
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={day.toISOString()} 
                className={`border-r border-b border-border p-2 relative min-h-[100px] flex flex-col ${!isCurrentMonth ? 'bg-background/50 opacity-60' : 'bg-card'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Heatmap Indicator */}
                  {dayTasks.length > 0 && (
                     <div 
                       className={`w-3 h-3 rounded-md mt-1.5 mr-1 ${getHeatmapColor(workloadPercentage)}`} 
                       title={`${workloadPercentage.toFixed(0)}%`}
                     />
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1">
                  {dayTasks.slice(0, 4).map(task => (
                    <div 
                      key={task.id}
                      className="text-[9px] font-semibold leading-tight truncate px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: task.status === 'Completed' ? '#f8fafc' : '#f1f5f9',
                        borderColor: task.status === 'Completed' ? '#e2e8f0' : '#cbd5e1',
                        color: task.status === 'Completed' ? '#94a3b8' : '#334155',
                        textDecoration: task.status === 'Completed' ? 'line-through' : 'none'
                      }}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 4 && (
                    <div className="text-[9px] text-muted-foreground font-bold pl-1">
                      + {dayTasks.length - 4}
                    </div>
                  )}
                </div>
                
                {dayTasks.length > 0 && (
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground font-bold px-1 border-t pt-1 border-border uppercase">
                    <span>{t('tasks.taskCount', { count: dayTasks.length })}</span>
                    {completedCount > 0 && <span className="text-emerald-600">{completedCount} {t('tasks.done')}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
