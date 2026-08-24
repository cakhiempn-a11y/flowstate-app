import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useStore } from '../../store/useStore';
import { useTasks } from '../../store/useTasks';
import { Play, Square } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { format } from 'date-fns';

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, dateLocale } = useTranslation();
  const checkOverdueTasks = useStore(s => s.checkOverdueTasks);
  const activeTimer = useStore(s => s.activeTimer);
  const stopTimer = useStore(s => s.stopTimer);
  const tasks = useTasks();
    
  const setCurrentTime = useStore(s => s.setCurrentTime);

  useEffect(() => {
    // Check overdue on mount and every minute
    checkOverdueTasks();
    const overdueInterval = setInterval(checkOverdueTasks, 60000);
    
    // Real-time clock for effective status UI
    const tick = () => {
      setCurrentTime(Date.now());
    };
    const timeInterval = setInterval(tick, 1000);
    
    // Refresh on tab visibility / focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    const handleFocus = () => tick();
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(overdueInterval);
      clearInterval(timeInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkOverdueTasks, setCurrentTime]);

  const activeTask = activeTimer ? tasks.find(taskItem => taskItem.id === activeTimer.taskId) : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      <Sidebar />
      <div className="pl-64 flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center px-8 justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('common.workspace')}</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {format(new Date(), 'PPPP', { locale: dateLocale })}
            </p>
          </div>
          
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
      
          </div>
  );
}
