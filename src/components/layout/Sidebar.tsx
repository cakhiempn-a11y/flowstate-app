import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CalendarRange, 
  Calendar, 
  CheckSquare, 
  Inbox,
  BarChart2, 
  Settings,
  Square
, Heart} from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { useTasks } from '../../store/useTasks';
import { useTranslation } from '../../i18n/useTranslation';
import { LogOut, UserCircle } from 'lucide-react';
import { Mascot } from '../Mascot';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';


import { ClockLogo } from '../ClockLogo';


function LiveTimer({ startTime, totalActualMinutes }: { startTime: string; totalActualMinutes: number }) {
  const [now, setNow] = useState(Date.now());
  const { t } = useTranslation();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedMs = Math.max(0, now - new Date(startTime).getTime());
  const elapsedSecs = Math.floor(elapsedMs / 1000);
  
  const h = Math.floor(elapsedSecs / 3600);
  const m = Math.floor((elapsedSecs % 3600) / 60);
  const s = elapsedSecs % 60;
  const currentFormatted = h > 0 
    ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const currentMinutes = elapsedMs / 60000;
  const totalMinutes = totalActualMinutes + currentMinutes;
  
  return (
    <div className="mt-3 space-y-2">
      <div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('timeTracking.currentSession') || 'Current Session'}</div>
        <div className="text-white font-mono text-xl font-bold tracking-tight">{currentFormatted}</div>
      </div>
      <div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('timeTracking.totalActualTime') || 'Total Actual Time'}</div>
        <div className="text-indigo-300 font-mono text-sm">{formatDuration(totalMinutes)}</div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const clearStoreForLogout = useStore(s => s.clearStoreForLogout);
  const { user } = useAuth();
  const profile = useStore(s => s.profile);
  const { t } = useTranslation();
  const theme = useStore(s => s.settings?.theme);
  const activeTimer = useStore(s => s.activeTimer);
  const tasks = useTasks();
  const stopTimer = useStore(s => s.stopTimer);
  const timeEntries = useStore(s => s.timeEntries);
  
  const activeTask = activeTimer ? tasks.find(taskItem => taskItem.id === activeTimer.taskId) : null;
  
  const unscheduledCount = tasks.filter(t => (!t.date || t.date === '') && t.status !== 'Completed' && t.status !== 'Skipped' && t.status !== 'Cancelled').length;

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), to: '/' },
    { icon: Calendar, label: t('nav.calendar'), to: '/calendar' },
    { icon: CheckSquare, label: t('nav.taskManager'), to: '/tasks' },
    { icon: Inbox, label: t('nav.unscheduledTasks') || 'Unscheduled Tasks', to: '/unscheduled', count: unscheduledCount },
    { icon: Heart, label: t('nav.specialFeatures') || 'Private Space', to: '/special' },
    { icon: BarChart2, label: t('nav.analytics'), to: '/analytics' },
    { icon: Settings, label: t('nav.settings'), to: '/settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-20">
      <div className="p-6 flex items-center gap-3">
        <ClockLogo className="w-8 h-8" />
        <span className="text-white font-bold text-lg tracking-tight">FlowState</span>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-3 py-3 md:py-2 rounded-md text-sm font-medium transition-colors gap-2",
                isActive
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <item.icon className="w-5 h-5 flex-shrink-0 opacity-80" />
                  <span className="leading-tight">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span 
                    className={cn(
                      "flex items-center justify-center text-[11px] font-bold rounded-full min-w-[24px] h-[24px] px-1.5 flex-shrink-0",
                      isActive 
                        ? "bg-white text-primary" 
                        : "bg-slate-700/50 text-slate-300"
                    )}
                    aria-label={
                      item.count === 1 
                        ? (t('unscheduledTasks.badgeSingle') || '1 unscheduled task').replace('{{count}}', item.count.toString())
                        : (t('unscheduledTasks.badgePlural') || '{{count}} unscheduled tasks').replace('{{count}}', item.count.toString())
                    }
                  >
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {activeTask && activeTimer && (
        <div className="p-4 bg-slate-800 m-4 rounded-xl border border-slate-700/50 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 animate-pulse" />
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-bold">{t('common.activeSession')}</div>
          <div className="text-white text-sm font-bold leading-tight mb-2 line-clamp-2">{activeTask.title}</div>
          <div className="text-red-400 text-xs font-bold mt-1 flex items-center gap-2">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
             {t('common.recording')}
          </div>
          <LiveTimer 
            startTime={activeTimer.startTime} 
            totalActualMinutes={timeEntries.filter(te => te.taskId === activeTask.id).reduce((acc, curr) => acc + curr.duration, 0)} 
          />
          <button 
            onClick={() => {
              stopTimer();
              alert(t('timeTracking.recordingStopped'));
            }}
            className="mt-4 w-full flex items-center justify-center bg-red-500 text-white py-2 rounded-lg text-xs font-bold shadow-md hover:bg-red-600 transition-colors"
          >
            <Square className="w-3.5 h-3.5 mr-1.5 fill-current" /> {t('common.stopTimer')}
          </button>
        </div>
      )}
    
      {user && (
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group relative">
                        {(profile?.avatarUrl || user.photoURL) ? (
              <img src={profile?.avatarUrl || user?.photoURL} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-slate-700" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center overflow-hidden">
                <Mascot className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{user.displayName || 'User'}</div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
            </div>
            
            {/* Popover Menu (Simplified as hover menu for now, or just links) */}
            
            <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-50">
              <NavLink to="/settings" onClick={() => window.scrollTo(0,0)} className="px-4 py-3 text-sm text-white hover:bg-slate-700 flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                {t('settings.profile')}
              </NavLink>
              <NavLink to="/settings" onClick={() => window.scrollTo(0,0)} className="px-4 py-3 text-sm text-white hover:bg-slate-700 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t('settings.accountSettings')}
              </NavLink>
              <button 
                onClick={() => { signOut(auth); clearStoreForLogout(); }}
                className="px-4 py-3 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 text-left w-full"
              >
                <LogOut className="w-4 h-4" />
                {t('settings.logout') || 'Logout'}
              </button>
            </div>

          </div>
        </div>
      )}

    </aside>
  );
}
