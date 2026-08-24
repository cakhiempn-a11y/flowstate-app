import { Select } from '../components/ui';
import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import DailySchedule from './DailySchedule';
import WeeklySchedule from './WeeklySchedule';
import MonthlyCalendar from './MonthlyCalendar';
import CustomRangeCalendar from './CustomRangeCalendar';
import { useStore } from '../store/useStore';
import { Filter } from 'lucide-react';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'custom';

export interface CalendarFilters {
  categoryId: string | 'all';
  status: string | 'all';
  priority: string | 'all';
}

export default function CalendarPage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const categories = useStore(s => s.categories);
  
  const [filters, setFilters] = useState<CalendarFilters>({
    categoryId: 'all',
    status: 'all',
    priority: 'all'
  });
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="bg-muted p-1 rounded-lg flex space-x-1">
          <button 
            onClick={() => setViewMode('day')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'day' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('schedule.dayView') || 'Day'}
          </button>
          <button 
            onClick={() => setViewMode('week')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'week' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('schedule.weekView') || 'Week'}
          </button>
          <button 
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('schedule.monthView') || 'Month'}
          </button>
          <button 
            onClick={() => setViewMode('custom')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'custom' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('schedule.customView') || 'Custom'}
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          <div className="flex items-center text-muted-foreground mr-2">
            <Filter className="w-4 h-4 mr-1" />
          </div>
          <Select
            value={filters.categoryId}
            onChange={(value) => setFilters({ ...filters, categoryId: value })}
            className="w-36"
            options={[
              { value: "all", label: t('tasks.allCategories') || 'All Categories' },
              ...categories.filter(c => !c.archived).map(c => ({ value: c.id, label: c.name }))
            ]}
          />
          <Select
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            className="w-36"
            options={[
              { value: "all", label: t('tasks.allStatuses') || 'All Statuses' },
              { value: "Not Started", label: t('status.notStarted') },
              { value: "In Progress", label: t('status.inProgress') },
              { value: "Completed", label: t('status.completed') },
              { value: "Overdue", label: t('status.overdue') }
            ]}
          />
          <Select
            value={filters.priority}
            onChange={(value) => setFilters({ ...filters, priority: value })}
            className="w-36"
            options={[
              { value: "all", label: t('tasks.allPriorities') || 'All Priorities' },
              { value: "Low", label: t('priority.low') },
              { value: "Medium", label: t('priority.medium') },
              { value: "High", label: t('priority.high') },
              { value: "Urgent", label: t('priority.urgent') }
            ]}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {viewMode === 'day' && <DailySchedule filters={filters} />}
        {viewMode === 'week' && <WeeklySchedule filters={filters} />}
        {viewMode === 'month' && <MonthlyCalendar filters={filters} />}
        {viewMode === 'custom' && <CustomRangeCalendar filters={filters} />}
      </div>
    </div>
  );
}
