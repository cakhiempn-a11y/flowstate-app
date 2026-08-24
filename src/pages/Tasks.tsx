import { DatePicker } from '../components/DatePicker';
import { Select } from '../components/ui';
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTasks } from '../store/useTasks';
import { format, parseISO, isSameDay, addDays, subDays, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Doodle } from '../components/Doodle';
import { DynamicIcon } from '../components/DynamicIcon';
import { Card, Badge, Button } from '../components/ui';
import { Search, Plus, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDuration } from '../lib/utils';
import TaskModal from '../components/TaskModal';
import { useTranslation } from '../i18n/useTranslation';
import { formatTimeString } from '../lib/utils';

type SortOption = 'earliestTime' | 'latestTime' | 'nearestDueDate' | 'furthestDueDate' | 'newestCreated' | 'oldestCreated';
type DateFilterType = 'today' | 'tomorrow' | 'yesterday' | 'week' | 'month' | 'custom' | 'range' | 'all';

export default function Tasks() {
  const { t, dateLocale, language } = useTranslation();
  const settings = useStore(s => s.settings);
  const tasks = useTasks();
  const categories = useStore(s => s.categories);
  const timeEntries = useStore(s => s.timeEntries);
  const startTimer = useStore(s => s.startTimer);
  const stopTimer = useStore(s => s.stopTimer);
  const activeTimer = useStore(s => s.activeTimer);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('earliestTime');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [rangeStart, setRangeStart] = useState<Date>(new Date());
  const [rangeEnd, setRangeEnd] = useState<Date>(addDays(new Date(), 7));

  const getEffectiveSingleDate = () => {
    const today = new Date();
    if (dateFilter === 'today') return today;
    if (dateFilter === 'tomorrow') return addDays(today, 1);
    if (dateFilter === 'yesterday') return subDays(today, 1);
    return customDate;
  };

  const handlePrevDay = () => {
    if (['today', 'tomorrow', 'yesterday', 'custom'].includes(dateFilter)) {
      setCustomDate(subDays(getEffectiveSingleDate(), 1));
      setDateFilter('custom');
    }
  };

  const handleNextDay = () => {
    if (['today', 'tomorrow', 'yesterday', 'custom'].includes(dateFilter)) {
      setCustomDate(addDays(getEffectiveSingleDate(), 1));
      setDateFilter('custom');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDateFilter('all');
    setSortOption('earliestTime');
  };

  const filteredTasks = tasks.filter(t_item => {
    const matchesSearch = t_item.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t_item.status === statusFilter;
    
    let matchesDate = true;
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    switch (dateFilter) {
      case 'today':
        matchesDate = t_item.date === todayStr;
        break;
      case 'tomorrow':
        matchesDate = t_item.date === format(addDays(today, 1), 'yyyy-MM-dd');
        break;
      case 'yesterday':
        matchesDate = t_item.date === format(subDays(today, 1), 'yyyy-MM-dd');
        break;
      case 'week':
        matchesDate = t_item.date >= format(startOfWeek(today), 'yyyy-MM-dd') && t_item.date <= format(endOfWeek(today), 'yyyy-MM-dd');
        break;
      case 'month':
        matchesDate = t_item.date >= format(startOfMonth(today), 'yyyy-MM-dd') && t_item.date <= format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'custom':
        matchesDate = t_item.date === format(customDate, 'yyyy-MM-dd');
        break;
      case 'range':
        matchesDate = t_item.date >= format(rangeStart, 'yyyy-MM-dd') && t_item.date <= format(rangeEnd, 'yyyy-MM-dd');
        break;
      case 'all':
      default:
        matchesDate = true;
        break;
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortOption) {
      case 'earliestTime': {
        const timeA = a.date ? new Date(`${a.date}T${a.startTime || '00:00'}`).getTime() : Infinity;
        const timeB = b.date ? new Date(`${b.date}T${b.startTime || '00:00'}`).getTime() : Infinity;
        if (timeA === timeB) return 0;
        return timeA - timeB;
      }
      case 'latestTime': {
        const timeA = a.date ? new Date(`${a.date}T${a.startTime || '23:59'}`).getTime() : -Infinity;
        const timeB = b.date ? new Date(`${b.date}T${b.startTime || '23:59'}`).getTime() : -Infinity;
        if (timeA === timeB) return 0;
        return timeB - timeA;
      }
      case 'nearestDueDate': {
        const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        if (timeA === timeB) return 0;
        return timeA - timeB;
      }
      case 'furthestDueDate': {
        const timeA = a.deadline ? new Date(a.deadline).getTime() : -Infinity;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : -Infinity;
        if (timeA === timeB) return 0;
        return timeB - timeA;
      }
      case 'newestCreated': {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA === timeB) return 0;
        return timeB - timeA;
      }
      case 'oldestCreated': {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
        if (timeA === timeB) return 0;
        return timeA - timeB;
      }
      default:
        return 0;
    }
  });

  
  const getCategory = (id: string) => categories.find(c => c.id === id);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  const getActualDuration = (taskId: string) => {
    return timeEntries
      .filter(te => te.taskId === taskId)
      .reduce((acc, curr) => acc + curr.duration, 0);
  };

  const handleEdit = (id: string) => {
    setEditingTaskId(id);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingTaskId(null);
    setModalOpen(true);
  };

  const statuses = [
    { key: 'All', label: t('status.all') },
    { key: 'Not Started', label: t('status.notStarted') },
    { key: 'In Progress', label: t('status.inProgress') },
    { key: 'Paused', label: t('status.paused') },
    { key: 'Completed', label: t('status.completed') },
    { key: 'Overdue', label: t('status.overdue') },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('tasks.title')}</h1>
        </div>
        <Button onClick={handleNew} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          {t('tasks.new')}
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex flex-col gap-4 bg-card rounded-t-2xl">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            
            <div className="flex flex-col sm:flex-row flex-wrap flex-1 gap-4 items-start sm:items-center w-full">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder={t('tasks.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
              </div>

              <div className="flex items-center bg-background border border-border rounded-lg p-1 w-full sm:w-auto">
                <button onClick={handlePrevDay} className="p-1.5 hover:bg-card rounded transition-colors text-muted-foreground hover:text-foreground shadow-sm">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <Select
                  value={dateFilter}
                  onChange={(value) => setDateFilter(value as DateFilterType)}
                  className="flex-1 sm:w-36 text-center"
                  options={[
                    { value: "today", label: t('filters.today') },
                    { value: "tomorrow", label: t('filters.tomorrow') },
                    { value: "yesterday", label: t('filters.yesterday') },
                    { value: "week", label: t('filters.thisWeek') },
                    { value: "month", label: t('filters.thisMonth') },
                    { value: "custom", label: t('filters.customDate') },
                    { value: "range", label: t('filters.customRange') },
                    { value: "all", label: t('filters.allDates') }
                  ]}
                />

                <button onClick={handleNextDay} className="p-1.5 hover:bg-card rounded transition-colors text-muted-foreground hover:text-foreground shadow-sm">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              
              <Select
                value={sortOption}
                onChange={(value) => setSortOption(value as SortOption)}
                className="w-full sm:w-48"
                options={[
                  { value: 'earliestTime', label: t('sort.earliestTime') || 'Earliest Time' },
                  { value: 'latestTime', label: t('sort.latestTime') || 'Latest Time' },
                  { value: 'nearestDueDate', label: t('sort.nearestDueDate') || 'Nearest Due Date' },
                  { value: 'furthestDueDate', label: t('sort.furthestDueDate') || 'Furthest Due Date' },
                  { value: 'newestCreated', label: t('sort.newestCreated') || 'Newest Created' },
                  { value: 'oldestCreated', label: t('sort.oldestCreated') || 'Oldest Created' },
                ]}
              />

              {dateFilter === 'custom' && (
                <DatePicker
                  value={format(customDate, 'yyyy-MM-dd')}
                  onChange={(val) => val && setCustomDate(parseISO(val))}
                  className="w-40 border border-border rounded-lg text-sm font-medium px-3 py-2 bg-background"
                />
              )}
              {dateFilter === 'range' && (
                <div className="flex items-center gap-2">
                  <DatePicker
                    value={format(rangeStart, 'yyyy-MM-dd')}
                    onChange={(val) => val && setRangeStart(parseISO(val))}
                    className="w-40 border border-border rounded-lg text-sm font-medium px-3 py-2 bg-background"
                  />
                  <span className="text-muted-foreground font-bold">-</span>
                  <DatePicker
                    value={format(rangeEnd, 'yyyy-MM-dd')}
                    onChange={(val) => val && setRangeEnd(parseISO(val))}
                    className="w-40 border border-border rounded-lg text-sm font-medium px-3 py-2 bg-background"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                {t('tasks.taskCountFound', { count: sortedTasks.length })}
              </div>
              {(search || statusFilter !== 'All' || dateFilter !== 'all') && (
                <button onClick={clearFilters} className="text-xs font-bold text-primary hover:text-primary/90 whitespace-nowrap">
                  {t('filters.clearFilters')}
                </button>
              )}
            </div>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-1 mt-2">
            {statuses.map(status => (
              <button
                key={status.key}
                onClick={() => setStatusFilter(status.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${statusFilter === status.key ? 'bg-slate-900 text-white shadow-sm' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider bg-background border-b border-border">
              <tr>
                <th className="px-6 py-4">{t('common.task')}</th>
                <th className="px-6 py-4">{t('common.date')}</th>
                <th className="px-6 py-4">{t('common.category')}</th>
                <th className="px-6 py-4">{t('common.status')}</th>
                <th className="px-6 py-4 text-right">{t('tasks.plannedActual')}</th>
                <th className="px-6 py-4 text-center">{t('tasks.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-card">
              {sortedTasks.map(task => {
                const actual = getActualDuration(task.id);
                const isTimerActive = activeTimer?.taskId === task.id;
                
                // Translate status
                let translatedStatus: string = task.status;
                if (task.status === 'Completed') translatedStatus = t('status.completed');
                else if (task.status === 'In Progress') translatedStatus = t('status.inProgress');
                else if (task.status === 'Paused') translatedStatus = t('status.paused');
                else if (task.status === 'Overdue') translatedStatus = t('status.overdue');
                else if (task.status === 'Not Started') translatedStatus = t('status.notStarted');
                else if (task.status === 'Cancelled') translatedStatus = t('status.cancelled');
                
                return (
                  <tr key={task.id} className="hover:bg-background/50 transition-colors group cursor-pointer" onClick={() => handleEdit(task.id)}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5 font-medium">{task.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-foreground">
                        {task.date ? format(parseISO(task.date), 'PPP', { locale: dateLocale }) : (task.deadline ? format(parseISO(task.deadline), 'PPP', { locale: dateLocale }) : t('unscheduledTasks.noDueDate') || 'No Due Date')}
                      </span>
                      {task.date ? (
                        <div className="text-xs text-muted-foreground mt-0.5 font-medium">{formatTimeString(task.startTime, settings?.timeFormat || '24h', language)} - {formatTimeString(task.endTime, settings?.timeFormat || '24h', language)}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-0.5 font-medium uppercase">{t('nav.unscheduledTasks') || 'Unscheduled'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const cat = getCategory(task.categoryId);
                        return cat ? (
                          <div className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                            <DynamicIcon name={cat.icon || 'tag'} className="w-3 h-3" />
                            <span>{cat.name}</span>
                          </div>
                        ) : (
                          <span className="bg-muted text-foreground px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                            {getCategoryName(task.categoryId)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        task.status === 'Completed' ? 'success' :
                        task.status === 'Overdue' ? 'danger' :
                        task.status === 'In Progress' ? 'info' :
                        task.status === 'Paused' ? 'warning' : 'default'
                      }>
                        {translatedStatus}
                      </Badge>
                      {task.status !== 'Completed' && task.progress > 0 && (
                        <div className="text-xs text-muted-foreground mt-1 font-semibold">{task.progress}% {t('tasks.done')}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="font-bold text-foreground">{formatDuration(actual)}</div>
                      <div className="text-[10px] font-bold text-muted-foreground mt-0.5">/ {formatDuration(task.plannedDuration)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       {task.status !== 'Completed' && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (isTimerActive) {
                                stopTimer();
                                alert(t('timeTracking.recordingStopped'));
                              } else {
                                startTimer(task.id); 
                              }
                            }}
                            className={`p-1.5 rounded-md shadow-sm transition-colors ${isTimerActive ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                            title={isTimerActive ? t('common.stopTimer') : task.status === 'Paused' ? t('timeTracking.resume') : t('timeTracking.startTimer')}
                          >
                            {isTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>
                       )}
                    </td>
                  </tr>
                );
              })}
              {sortedTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    
                    <div className="flex justify-center mb-6 relative">
                      <Doodle name="coffee" className="-top-8 text-primary/40" />
                    </div>
                    <div className="text-muted-foreground font-medium mb-4">

                      {dateFilter !== 'all' ? t('tasks.noTasks') : t('tasks.emptyNoTasks')}
                    </div>
                    <Button onClick={handleNew} variant="outline" className="mx-auto">
                      {t('tasks.createTask')}
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <TaskModal 
          onClose={() => setModalOpen(false)}
          existingTask={editingTaskId ? tasks.find(t => t.id === editingTaskId) : undefined} isOpen={isModalOpen}
        />
      )}
    </div>
  );
}
