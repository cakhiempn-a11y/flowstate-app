import { DatePicker } from '../components/DatePicker';
import { Select } from '../components/ui';

import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useTasks } from '../store/useTasks';
import { Doodle } from '../components/Doodle';
import { DynamicIcon } from '../components/DynamicIcon';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui';
import { formatDuration, calculateVariance, calculateCompletionRate } from '../lib/utils';
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, format, eachDayOfInterval, getDay, differenceInDays } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTranslation } from '../i18n/useTranslation';
import { WorkloadTimeline } from '../components/WorkloadTimeline';
import { cn } from '../lib/utils';

type DateRange = 'today' | 'week' | 'month' | 'custom';

export default function Dashboard() {
  const { t, dateLocale, language } = useTranslation();
  const [range, setRange] = useState<DateRange>('week');
  const [customStart, setCustomStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const tasks = useTasks();
  const timeEntries = useStore(s => s.timeEntries);
  const categories = useStore(s => s.categories);
  const settings = useStore(s => s.settings);

  const periods = useMemo(() => {
    const now = new Date();
    const ws = settings?.weekStartsOn || 1;
    let current, previous;

    if (range === 'today') {
      current = { start: startOfDay(now), end: endOfDay(now) };
      previous = { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
    } else if (range === 'week') {
      current = { start: startOfWeek(now, { weekStartsOn: ws }), end: endOfWeek(now, { weekStartsOn: ws }) };
      previous = { start: startOfWeek(subDays(current.start, 1), { weekStartsOn: ws }), end: endOfWeek(subDays(current.start, 1), { weekStartsOn: ws }) };
    } else if (range === 'month') {
      current = { start: startOfMonth(now), end: endOfMonth(now) };
      // Previous month
      const prevMonth = startOfMonth(subDays(current.start, 1));
      previous = { start: prevMonth, end: endOfMonth(prevMonth) };
    } else {
      current = { start: startOfDay(parseISO(customStart)), end: endOfDay(parseISO(customEnd)) };
      const days = Math.round((current.end.getTime() - current.start.getTime()) / (1000 * 60 * 60 * 24));
      const prevEnd = endOfDay(subDays(current.start, 1));
      const prevStart = startOfDay(subDays(prevEnd, days - 1)); // days includes the start day itself if they are same day, wait. 
      // Actually, days = difference in days. If start==end, days=0, so prevStart = subDays(prevEnd, 0)
      previous = { start: prevStart, end: prevEnd };
    }
    return { current, previous };
  }, [range, customStart, customEnd, settings?.weekStartsOn]);

  const dateInterval = periods.current;

  const stats = useMemo(() => {
    // Basic filtering
    const startStr = format(dateInterval.start, 'yyyy-MM-dd');
    const endStr = format(dateInterval.end, 'yyyy-MM-dd');
    
    const intervalTasks = tasks.filter(task => task.date >= startStr && task.date <= endStr);
    const intervalEntries = timeEntries.filter(te => {
      const teDate = format(parseISO(te.startTime), 'yyyy-MM-dd');
      return teDate >= startStr && teDate <= endStr;
    });

    const catTasks = categoryFilter === 'all' ? intervalTasks : intervalTasks.filter(t => t.categoryId === categoryFilter);
    const catEntries = categoryFilter === 'all' ? intervalEntries : intervalEntries.filter(te => catTasks.some(t => t.id === te.taskId));
    
    // KPI 1 & 2: Completed Tasks & Completion Rate
    const actualTimeByTask = new Map<string, number>();
    catEntries.forEach(te => {
      if (Number.isFinite(te.duration)) {
        actualTimeByTask.set(te.taskId, (actualTimeByTask.get(te.taskId) || 0) + te.duration);
      }
    });

    const activeTasks = catTasks.filter(t => t.status !== 'Cancelled');
    const totalActiveTasks = activeTasks.length;
    let completedTasksCount = 0;
    
    activeTasks.forEach(t => {
      const actual = actualTimeByTask.get(t.id) || 0;
      if (actual >= t.plannedDuration) {
        completedTasksCount++;
      }
    });

    let plannedTime = 0;
    activeTasks.forEach(t => { if (Number.isFinite(t.plannedDuration)) plannedTime += t.plannedDuration; });

    let actualTime = 0;
    catEntries.forEach(te => { if (Number.isFinite(te.duration)) actualTime += te.duration; });

    let completionRate = 0;
    if (plannedTime > 0) {
      completionRate = (actualTime / plannedTime) * 100;
    }

    // KPI 3: Free Time
    const daysInInterval = eachDayOfInterval(dateInterval);
    const capacityMinutes = daysInInterval.length * 24 * 60;
    const freeTimeMinutes = Math.max(0, capacityMinutes - plannedTime);
    const overbookedMinutes = Math.max(0, plannedTime - capacityMinutes);

    // KPI 4: Completion Rate Change
    const getPeriodRate = (interval: {start: Date, end: Date}) => {
      const startStr = format(interval.start, 'yyyy-MM-dd');
      const endStr = format(interval.end, 'yyyy-MM-dd');
      
      const pTasks = tasks.filter(task => task.date >= startStr && task.date <= endStr);
      const pEntries = timeEntries.filter(te => {
        const teDate = format(parseISO(te.startTime), 'yyyy-MM-dd');
        return teDate >= startStr && teDate <= endStr;
      });
      
      const pCatTasks = categoryFilter === 'all' ? pTasks : pTasks.filter(t => t.categoryId === categoryFilter);
      const pCatEntries = categoryFilter === 'all' ? pEntries : pEntries.filter(te => pCatTasks.some(t => t.id === te.taskId));
      
      const activePTasks = pCatTasks.filter(t => t.status !== 'Cancelled');
      
      let pPlanned = 0;
      activePTasks.forEach(t => { if (Number.isFinite(t.plannedDuration)) pPlanned += t.plannedDuration; });
      let pActual = 0;
      pCatEntries.forEach(te => { if (Number.isFinite(te.duration)) pActual += te.duration; });
      
      if (pPlanned === 0) return null;
      return (pActual / pPlanned) * 100;
    };

    const currentPeriodRate = getPeriodRate(periods.current);
    const previousPeriodRate = getPeriodRate(periods.previous);
    
    let rateChange = null;
    if (currentPeriodRate !== null && previousPeriodRate !== null) {
      rateChange = Math.min(100, currentPeriodRate) - Math.min(100, previousPeriodRate);
    }

    return {
      completedTasksCount,
      totalActiveTasks,
      completionRate,
      plannedTime,
      actualTime,
      freeTimeMinutes,
      overbookedMinutes,
      rateChange,

      catTasks,
      catEntries,
      daysInInterval
    };
  }, [tasks, timeEntries, dateInterval, categoryFilter, periods]);

  const getFreeTimeStatus = (freeTime: number, availableTime: number, overloadedTime: number) => {
    if (overloadedTime > 0) return { label: t('dashboard.overloaded') || 'Overloaded', color: 'text-red-500' };
    if (availableTime === 0) return { label: '-', color: 'text-muted-foreground' };
    const ratio = freeTime / availableTime;
    if (ratio > 0.5) return { label: t('dashboard.veryFree') || 'Very Free', color: 'text-emerald-500' };
    if (ratio > 0.3) return { label: t('dashboard.comfortable') || 'Comfortable', color: 'text-emerald-600' };
    if (ratio > 0.15) return { label: t('dashboard.moderate') || 'Moderate', color: 'text-amber-500' };
    if (ratio > 0) return { label: t('dashboard.limited') || 'Limited', color: 'text-amber-600' };
    return { label: t('dashboard.fullyScheduled') || 'Fully Scheduled', color: 'text-red-500' };
  };

  const getUtilizationStatus = (utilization: number) => {
    if (utilization > 100) return { label: t('dashboard.overloaded') || 'Overloaded', color: 'text-red-500' };
    if (utilization >= 90) return { label: t('dashboard.veryBusy') || 'Very Busy', color: 'text-amber-600' };
    if (utilization >= 75) return { label: t('dashboard.busy') || 'Busy', color: 'text-amber-500' };
    if (utilization >= 50) return { label: t('dashboard.balanced') || 'Balanced', color: 'text-emerald-600' };
    return { label: t('dashboard.light') || 'Light', color: 'text-emerald-500' };
  };


  // Daily Workload Overview
  const dailyWorkload = useMemo(() => {
    return stats.daysInInterval.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTasks = stats.catTasks.filter(t => t.date === dayStr);
      console.log('dayStr', dayStr, 'tasks:', dayTasks.map(t => t.title));
      const dayEntries = stats.catEntries.filter(te => format(parseISO(te.startTime), 'yyyy-MM-dd') === dayStr);
      
      const dayAvailable = 24 * 60; // 24 hours capacity

      let dayPlanned = 0;
      dayTasks.filter(t => t.status !== 'Cancelled').forEach(t => { if (Number.isFinite(t.plannedDuration)) dayPlanned += t.plannedDuration; });

      let dayActual = 0;
      dayEntries.forEach(te => { if (Number.isFinite(te.duration)) dayActual += te.duration; });

      const dayUtilization = dayAvailable > 0 ? Math.round((dayPlanned / dayAvailable) * 100) : 0;
      const dayFree = Math.max(0, dayAvailable - dayPlanned);
      
      return {
        date: day,
        dateStr: dayStr,
        name: format(day, stats.daysInInterval.length > 14 ? 'MMM d' : 'EEEE', { locale: dateLocale }),
        available: dayAvailable,
        planned: dayPlanned,
        actual: dayActual,
        free: dayFree,
        utilization: dayUtilization,
        tasks: dayTasks
      };
    });
  }, [stats.daysInInterval, stats.catTasks, stats.catEntries, dateLocale]);

  

  const rangeLabels = {
    today: t('filters.today'),
    week: t('filters.thisWeek'),
    month: t('filters.thisMonth'),
    custom: t('filters.customRange') || 'Custom'
  };

  // Heatmap generation
  const renderHeatmap = () => {
    // Only show hourly heatmap if days <= 7 for readability
    if (stats.daysInInterval.length > 7) {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' , backgroundColor: 'var(--card)', color: 'var(--foreground)'}}
              cursor={{ fill: 'var(--muted)' }}
              formatter={(val: number) => formatDuration(val)}
            />
            <Bar dataKey="planned" name={t('analytics.plannedTime')} fill="var(--muted)" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="actual" name={t('analytics.actualTime')} fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Hourly Heatmap
    return (
      <WorkloadTimeline 
        days={dailyWorkload} 
        intervalMinutes={settings?.analytics?.timelineInterval || 60} 
        timeFormat={settings?.timeFormat || '24h'}
      />
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm relative overflow-hidden">
        <Doodle name="calendar" className="right-4 top-4 text-primary/10" size={100} />
        
        <div className="flex flex-col space-y-3 z-10">
          <div className="flex items-center space-x-3">
             <div className="flex bg-muted p-1 rounded-lg">
                {(['today', 'week', 'month', 'custom'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-colors", range === r ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {rangeLabels[r]}
                  </button>
                ))}
              </div>
              {categoryFilter !== 'all' && (
                 <button onClick={() => setCategoryFilter('all')} className="text-xs text-primary font-semibold hover:underline">
                    {t('filters.clearFilters') || 'Clear Filters'}
                 </button>
              )}
          </div>
          
          {range === 'custom' && (
            <div className="flex items-center space-x-2">
              <DatePicker value={customStart} onChange={val => setCustomStart(val)} className="w-36 text-sm bg-background border border-border rounded-md px-2 py-1 outline-none" />
              <span className="text-muted-foreground">-</span>
              <DatePicker value={customEnd} onChange={val => setCustomEnd(val)} className="w-36 text-sm bg-background border border-border rounded-md px-2 py-1 outline-none" />
            </div>
          )}
        </div>
        
        <div className="z-10">
          <Select
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
            className="w-40"
            options={[
              { value: "all", label: t('status.all') || 'All Categories' },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]}
          />
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* KPI 1: Completed Tasks */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">{t('dashboard.completedTasks') || 'Completed Tasks'}</div>
            <div className="text-3xl font-bold mt-1 text-emerald-600">{stats.completedTasksCount} <span className="text-lg text-emerald-600/50">/ {stats.totalActiveTasks}</span></div>
          </div>
          
        </div>
        
        {/* KPI 2: Completion Rate */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">{t('dashboard.taskCompletionRate') || 'Task Completion Rate'}</div>
            <div className={cn("mt-1", stats.plannedTime > 0 ? "text-3xl font-bold text-primary" : "text-xl font-bold text-muted-foreground mt-2")}>
              {stats.plannedTime > 0 ? `${Math.min(100, Math.round(stats.completionRate))}%` : (t('dashboard.noData') || 'No data')}

            </div>
          </div>
          <div className="mt-4 flex flex-col space-y-1 text-xs font-bold">
             <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
               <div className="bg-primary h-full transition-all" style={{ width: `${Math.min(100, stats.completionRate)}%` }} />
             </div>
             {stats.actualTime > stats.plannedTime ? (
               <span className="text-emerald-500">+{formatDuration(stats.actualTime - stats.plannedTime)} </span>
             ) : (
               <span className="text-muted-foreground">{formatDuration(stats.actualTime)} / {formatDuration(stats.plannedTime)}</span>
             )}
          </div>
        </div>
        
        {/* KPI 3: Free Time */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">{t('dashboard.freeTime') || 'Free Time'}</div>
            <div className={cn("text-3xl font-bold mt-1", stats.overbookedMinutes > 0 ? "text-red-500" : "text-foreground")}>
              {stats.overbookedMinutes > 0 ? `0h` : formatDuration(stats.freeTimeMinutes)}
            </div>
          </div>
          <div className={cn("mt-4 text-xs font-bold", stats.overbookedMinutes > 0 ? "text-red-500" : "text-muted-foreground")}>
             {stats.overbookedMinutes > 0 
               ? `${t('dashboard.overbookedBy') || 'Overbooked by'} ${formatDuration(stats.overbookedMinutes)}` 
               : ''}
          </div>
        </div>
        
        {/* KPI 4: Completion Rate Change */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">{t('dashboard.completionRateChange') || 'Completion Rate Change'}</div>
            <div className={cn("text-3xl font-bold mt-1", 
              stats.rateChange === null ? "text-foreground" : 
              stats.rateChange >= 0 ? "text-emerald-500" : "text-orange-500"
            )}>
              {stats.rateChange === null 
                ? '--' 
                : (stats.rateChange > 0 ? '+' : '') + Math.round(stats.rateChange) + (language === 'vi' ? ' điểm %' : ' pt')}
            </div>
          </div>
          <div className="mt-4 text-[10px] font-bold text-muted-foreground uppercase">
             {stats.rateChange === null
                ? (t('dashboard.noComparisonData') || 'No comparison data')
                : (range === 'today' ? (t('dashboard.vsYesterday') || 'Compared with yesterday') :
                   range === 'week' ? (t('dashboard.vsLastWeek') || 'Compared with last week') :
                   range === 'month' ? (t('dashboard.vsLastMonth') || 'Compared with last month') :
                   (t('dashboard.vsPreviousPeriod') || 'Compared with the previous period'))}
          </div>
        </div>

      </div>

      {/* Secondary visualizations */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.workloadAndFreeTime') || 'Workload & Free Time'}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderHeatmap()}
          </CardContent>
        </Card>

        
      </div>
      
      {/* Weekly/Period Workload List */}
      <Card>
        <CardHeader>
           <CardTitle>{t('dashboard.weeklyWorkload') || 'Workload Overview'}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider bg-background border-y border-border">
              <tr>
                <th className="px-6 py-4">{t("common.date")}</th>
                <th className="px-6 py-4 text-right">{t('dashboard.availableTime') || 'Available'}</th>
                <th className="px-6 py-4 text-right">{t('analytics.plannedTime')}</th>
                <th className="px-6 py-4 text-right">{t('dashboard.freeTime') || 'Free Time'}</th>
                <th className="px-6 py-4 text-right">{t('analytics.actualTime')}</th>
                <th className="px-6 py-4 text-right">{t('dashboard.scheduledTimeRatio') || 'Utilization'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
               {dailyWorkload.map(day => (
                 <tr key={day.dateStr} className="hover:bg-background/50 transition-colors">
                   <td className="px-6 py-4 font-bold text-foreground">
                     {day.name}
                     <div className="text-xs font-medium text-muted-foreground">{format(day.date, 'MMM d', { locale: dateLocale })}</div>
                   </td>
                   <td className="px-6 py-4 text-right font-medium">{formatDuration(day.available)}</td>
                   <td className="px-6 py-4 text-right font-medium">{formatDuration(day.planned)}</td>
                   <td className={cn("px-6 py-4 text-right font-bold", day.free === 0 && day.planned > day.available ? 'text-red-500' : 'text-emerald-500')}>
                      {day.planned > day.available ? `-${formatDuration(day.planned - day.available)}` : formatDuration(day.free)}
                   </td>
                   <td className="px-6 py-4 text-right font-bold text-primary">{formatDuration(day.actual)}</td>
                   <td className="px-6 py-4 text-right">
                     <span className={cn("inline-flex items-center px-2 py-1 rounded text-[10px] font-bold", getUtilizationStatus(day.utilization).color.replace('text-', 'bg-').replace('500', '100') + " " + getUtilizationStatus(day.utilization).color)}>
                        {day.utilization}%
                     </span>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
