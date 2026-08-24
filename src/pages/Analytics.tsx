import { DatePicker } from '../components/DatePicker';
import { Select } from '../components/ui';

import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useTasks } from '../store/useTasks';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, format, subWeeks, subMonths, startOfYear, endOfYear, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { formatDuration, calculateVariance, cn } from '../lib/utils';
import { useTranslation } from '../i18n/useTranslation';

type DateRangeFilter = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';
type StatusFilter = 'All' | 'Not Started' | 'In Progress' | 'Paused' | 'Completed' | 'Overdue' | 'Cancelled';

export default function Analytics() {
  const { t, dateLocale } = useTranslation();
  
  const [dateRangeType, setDateRangeType] = useState<DateRangeFilter>('thisMonth');
  const [customStart, setCustomStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const tasks = useTasks();
  const categories = useStore(s => s.categories);
  const timeEntries = useStore(s => s.timeEntries);
  const settings = useStore(s => s.settings);

  const dateInterval = useMemo(() => {
    const now = new Date();
    const ws = settings?.weekStartsOn || 1;
    switch (dateRangeType) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday': return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case 'thisWeek': return { start: startOfWeek(now, { weekStartsOn: ws }), end: endOfWeek(now, { weekStartsOn: ws }) };
      case 'lastWeek': return { start: startOfWeek(subWeeks(now, 1), { weekStartsOn: ws }), end: endOfWeek(subWeeks(now, 1), { weekStartsOn: ws }) };
      case 'thisMonth': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth': return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'thisYear': return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom': return { start: startOfDay(parseISO(customStart)), end: endOfDay(parseISO(customEnd)) };
      default: return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [dateRangeType, customStart, customEnd, settings?.weekStartsOn]);

  const analyticsData = useMemo(() => {
    // 1. Filter tasks
    const startStr = format(dateInterval.start, 'yyyy-MM-dd');
    const endStr = format(dateInterval.end, 'yyyy-MM-dd');
    let filteredTasks = tasks.filter(t => t.date >= startStr && t.date <= endStr);
    
    if (categoryFilter !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.categoryId === categoryFilter);
    }
    if (statusFilter !== 'All') {
      filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
    }

    // 2. Filter entries (only those belonging to the filtered tasks and within date range)
    const filteredEntries = timeEntries.filter(te => {
      const teDate = format(parseISO(te.startTime), 'yyyy-MM-dd');
      return teDate >= startStr && teDate <= endStr && filteredTasks.some(t => t.id === te.taskId);
    });

    // 3. Category breakdown
    const displayCategories = categoryFilter === 'all' ? categories : categories.filter(c => c.id === categoryFilter);
    
    // First map all entries per task
    const actualTimeByTask = new Map<string, number>();
    filteredEntries.forEach(te => {
      if (Number.isFinite(te.duration)) {
        actualTimeByTask.set(te.taskId, (actualTimeByTask.get(te.taskId) || 0) + te.duration);
      }
    });

    const categoryStats = displayCategories.map(cat => {
      const catTasks = filteredTasks.filter(t => t.categoryId === cat.id);
      
        let planned = 0;
      catTasks.forEach(t => { if (Number.isFinite(t.plannedDuration)) planned += t.plannedDuration; });
      
      let actual = 0;
      catTasks.forEach(t => {
        const val = actualTimeByTask.get(t.id);
        if (Number.isFinite(val)) actual += val;
      });
      
      const activeTasks = catTasks.filter(t => t.status !== 'Cancelled');
      let completed = 0;
      activeTasks.forEach(t => {
        const tActual = actualTimeByTask.get(t.id) || 0;
        if (tActual >= t.plannedDuration) {
          completed++;
        }
      });
      
      let completionRate = 0;
      if (planned > 0) {
        completionRate = Math.min(100, Math.round((actual / planned) * 100));
      }
      
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        taskCount: catTasks.length,
        planned,
        actual,
        variance: actual - planned,
        completionRate
      };
    }).filter(cat => cat.taskCount > 0 || cat.actual > 0).sort((a, b) => b.actual - a.actual);

    // 4. Overall KPIs
    let totalPlanned = 0;
    let totalActual = 0;
    categoryStats.forEach(c => {
      totalPlanned += c.planned;
      totalActual += c.actual;
    });

    const activeTasksOverall = filteredTasks.filter(t => t.status !== 'Cancelled');
    const totalTasks = activeTasksOverall.length;
    let completedTasks = 0;
    activeTasksOverall.forEach(t => {
      const tActual = actualTimeByTask.get(t.id) || 0;
      if (tActual >= t.plannedDuration) {
        completedTasks++;
      }
    });

    return { categoryStats, totalPlanned, totalActual, totalTasks, completedTasks };
  }, [tasks, categories, timeEntries, dateInterval, categoryFilter, statusFilter]);

  const chartData = analyticsData.categoryStats.map(d => ({
    name: d.name,
    Planned: Number((d.planned / 60).toFixed(1)),
    Actual: Number((d.actual / 60).toFixed(1)),
  }));

  const hasFilters = dateRangeType !== 'thisMonth' || categoryFilter !== 'all' || statusFilter !== 'All';

  const clearFilters = () => {
    setDateRangeType('thisMonth');
    setCategoryFilter('all');
    setStatusFilter('All');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('analytics.title')}</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">{t('common.date') || 'Date'}</label>
            <Select
              value={dateRangeType}
              onChange={(value) => setDateRangeType(value as DateRangeFilter)}
              className="w-full"
              options={[
                { value: "today", label: t('filters.today') || 'Today' },
                { value: "yesterday", label: t('filters.yesterday') || 'Yesterday' },
                { value: "thisWeek", label: t('filters.thisWeek') || 'This Week' },
                { value: "lastWeek", label: t('filters.lastWeek') || 'Last Week' },
                { value: "thisMonth", label: t('filters.thisMonth') || 'This Month' },
                { value: "lastMonth", label: t('filters.lastMonth') || 'Last Month' },
                { value: "thisYear", label: t('filters.thisYear') || 'This Year' },
                { value: "custom", label: t('filters.customRange') || 'Custom Range' }
              ]}
            />
          </div>

          {dateRangeType === 'custom' && (
            <div className="space-y-1 flex items-end space-x-2">
              <DatePicker value={customStart} onChange={val => setCustomStart(val)} className="w-40 text-sm font-semibold bg-background border border-border rounded-lg px-3 py-2 outline-none" />
              <span className="text-muted-foreground pb-2">-</span>
              <DatePicker value={customEnd} onChange={val => setCustomEnd(val)} className="w-40 text-sm font-semibold bg-background border border-border rounded-lg px-3 py-2 outline-none" />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">{t('common.category') || 'Category'}</label>
            <Select
              value={categoryFilter}
              onChange={(value) => setCategoryFilter(value)}
              className="w-full"
              options={[
                { value: "all", label: t('status.all') || 'All Categories' },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">{t('common.status') || 'Status'}</label>
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              className="w-full"
              options={[
                { value: "All", label: t('status.all') || 'All' },
                { value: "Not Started", label: t('status.notStarted') || 'Not Started' },
                { value: "In Progress", label: t('status.inProgress') || 'In Progress' },
                { value: "Completed", label: t('status.completed') || 'Completed' },
                { value: "Overdue", label: t('status.overdue') || 'Overdue' },
                { value: "Cancelled", label: t('status.cancelled') || 'Cancelled' }
              ]}
            />
          </div>
        </div>

        {hasFilters && (
          <div className="pt-3 border-t border-border flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <span>{format(dateInterval.start, 'MMM d, yyyy')} - {format(dateInterval.end, 'MMM d, yyyy')}</span>
              {categoryFilter !== 'all' && <span>• {categories.find(c => c.id === categoryFilter)?.name}</span>}
              {statusFilter !== 'All' && <span>• {statusFilter}</span>}
            </div>
            <button onClick={clearFilters} className="text-primary font-bold hover:underline">
              {t('filters.clearFilters') || 'Clear Filters'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-wide">{t("analytics.filteredTasks") || "Filtered Tasks"}</div>
          <div className="text-3xl font-bold mt-1 text-foreground">{analyticsData.totalTasks}</div>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-wide">{t("dashboard.completedTasks") || "Completed Tasks"}</div>
          <div className="text-3xl font-bold mt-1 text-emerald-600">{analyticsData.completedTasks}</div>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-wide">{t("analytics.plannedTime") || "Planned Time"}</div>
          <div className="text-3xl font-bold mt-1 text-foreground">{formatDuration(analyticsData.totalPlanned)}</div>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-wide">{t("analytics.actualTime") || "Actual Time"}</div>
          <div className="text-3xl font-bold mt-1 text-primary">{formatDuration(analyticsData.totalActual)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">{t('analytics.plannedVsActual')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' , backgroundColor: 'var(--card)', color: 'var(--foreground)'}} />
                    <Legend />
                    <Bar dataKey="Planned" name={t('analytics.planned')} fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    <Bar dataKey="Actual" name={t('analytics.actual')} fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
               </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground font-medium">
                {t('dashboard.noData') || 'No task data available'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">{t('analytics.categoryBreakdown')}</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto p-0 m-0">
            <table className="w-full text-left text-sm text-muted-foreground border-t border-border">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('analytics.category')}</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">{t('analytics.tasks')}</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">{t("analytics.completionRate") || "Completion"}</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">{t('analytics.plannedTime')}</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">{t('analytics.actualTime')}</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">{t('analytics.variance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analyticsData.categoryStats.map(stat => (
                  <tr key={stat.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-6 py-4 font-bold flex items-center gap-2 text-foreground">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: stat.color }} />
                      {stat.name}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{stat.taskCount}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{stat.completionRate}%</td>
                    <td className="px-6 py-4 text-right font-medium">{formatDuration(stat.planned)}</td>
                    <td className="px-6 py-4 text-right font-bold text-primary">{formatDuration(stat.actual)}</td>
                    <td className={cn("px-6 py-4 text-right font-bold", stat.variance > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                      {stat.variance > 0 ? '+' : ''}{formatDuration(stat.variance)}
                    </td>
                  </tr>
                ))}
                {analyticsData.categoryStats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground font-medium">{t('messages.noResults') || 'No results found'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
