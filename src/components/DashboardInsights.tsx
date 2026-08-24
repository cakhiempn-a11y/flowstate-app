import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui';
import { Info } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { formatDuration } from '../lib/utils';
import { cn } from '../lib/utils';
import { AppSettings } from '../types';

interface InsightProps {
  settings: AppSettings;
  stats: any;
  dailyWorkload: any[];
}

export function DashboardInsights({ settings, stats, dailyWorkload }: InsightProps) {
  const { t, dateLocale } = useTranslation();
  
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const showDesc = settings.analytics?.showInsightDescriptions ?? true;
  const enabledList = settings.analytics?.enabledInsights || [
    'completionRate', 'scheduledTimeRatio', 'freeTime', 'busiestDay', 'freestDay', 'mostTimeConsumingCategory', 'mostOverloadedDay'
  ];

  const toggleExpand = (id: string) => {
    setExpandedInsight(expandedInsight === id ? null : id);
  };

  const isMultiDay = dailyWorkload.length > 1;

  const insightsMap: Record<string, { supportedGranularities: ('single' | 'multi')[], factory: () => { name: string, value: string, definition: string, formula: string, dataSource: string, interpretation: string, color: string } | null }> = {
    completedTasks: {
      supportedGranularities: ['single', 'multi'],
      factory: () => ({
        name: t('insights.completedTasks') || 'Completed Tasks',
        value: `${stats.completedTasks} / ${stats.totalTasks}`,
        definition: t('insights.def_completedTasks') || 'Total number of completed tasks versus total scheduled tasks.',
        formula: t('insights.form_completedTasks') || 'Completed Tasks count',
        dataSource: t('insights.data_taskStatuses') || 'Task statuses',
        interpretation: t('insights.mean_completedTasks') || 'Direct indicator of task completion volume.',
        color: 'text-foreground'
      })
    },
    completionRate: {
      supportedGranularities: ['single', 'multi'],
      factory: () => ({
        name: t('insights.completionRate') || 'Completion Rate',
        value: `${stats.completionRate}%`,
        definition: t('insights.def_completionRate') || 'The percentage of scheduled tasks that have been completed.',
        formula: t('insights.form_completionRate') || 'Completed Tasks / Total Tasks × 100',
        dataSource: t('insights.data_taskStatuses') || 'Task statuses',
        interpretation: t('insights.mean_completionRate') || 'A higher rate indicates better task completion.',
        color: stats.completionRate >= 80 ? 'text-emerald-500' : stats.completionRate < 50 ? 'text-red-500' : 'text-primary'
      })
    },
    freeTime: {
      supportedGranularities: ['single', 'multi'],
      factory: () => ({
        name: t('insights.freeTime') || 'Free Time',
        value: formatDuration(stats.freeTime),
        definition: t('insights.def_freeTime') || 'Unused working capacity after scheduled work is subtracted.',
        formula: t('insights.form_freeTime') || 'Available Capacity - Planned Time',
        dataSource: t('insights.data_freeTime') || 'Configured Working Hours & Scheduled Tasks',
        interpretation: t('insights.mean_freeTime') || 'Shows working capacity that is not currently scheduled.',
        color: 'text-emerald-500'
      })
    },
    scheduledTimeRatio: {
      supportedGranularities: ['single', 'multi'],
      factory: () => ({
        name: t('insights.scheduledTimeRatio') || 'Schedule Utilization',
        value: `${stats.scheduledTimeRatio}%`,
        definition: t('insights.def_scheduledTimeRatio') || 'The percentage of available working capacity that has been scheduled.',
        formula: t('insights.form_scheduledTimeRatio') || 'Planned Time / Available Capacity × 100',
        dataSource: t('insights.data_workingHours') || 'Working Hours & Task Durations',
        interpretation: t('insights.mean_scheduledTimeRatio') || 'Shows how much of your available working capacity has been scheduled.',
        color: stats.scheduledTimeRatio > 90 ? 'text-red-500' : 'text-primary'
      })
    },
    busiestDay: {
      supportedGranularities: ['multi'],
      factory: () => {
        const sorted = [...dailyWorkload].sort((a, b) => b.utilization - a.utilization);
        const day = sorted[0];
        if (!day || day.utilization === 0) return {
          name: t('insights.busiestDay') || 'Busiest Day',
          value: t('insights.noData') || 'No data',
          definition: t('insights.def_busiestDay'), formula: t('insights.form_busiestDay'), dataSource: t('insights.data_dailyBreakdown') || 'Daily breakdown', interpretation: t('insights.mean_busiestDay'), color: 'text-muted-foreground'
        };
        return {
          name: t('insights.busiestDay') || 'Busiest Day',
          value: `${day.date.toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })} — ${day.utilization}%`,
          definition: t('insights.def_busiestDay') || 'The day with the highest scheduled workload compared to available working capacity.',
          formula: t('insights.form_busiestDay') || 'Planned Time / Available Capacity × 100',
          dataSource: t('insights.data_dailyBreakdown') || 'Daily breakdown',
          interpretation: t('insights.mean_busiestDay') || 'A higher percentage means more of the available working capacity is scheduled.',
          color: day.utilization > 100 ? 'text-red-500' : 'text-primary'
        };
      }
    },
    freestDay: {
      supportedGranularities: ['multi'],
      factory: () => {
        const sorted = [...dailyWorkload].sort((a, b) => b.free - a.free);
        const day = sorted[0];
        if (!day || day.free === 0) return {
          name: t('insights.freestDay') || 'Freest Day',
          value: t('insights.noData') || 'No data',
          definition: t('insights.def_freestDay'), formula: t('insights.form_freestDay'), dataSource: t('insights.data_dailyBreakdown') || 'Daily breakdown', interpretation: t('insights.mean_freestDay'), color: 'text-muted-foreground'
        };
        return {
          name: t('insights.freestDay') || 'Freest Day',
          value: `${day.date.toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })} — ${formatDuration(day.free)}`,
          definition: t('insights.def_freestDay') || 'The day with the most unused working capacity.',
          formula: t('insights.form_freestDay') || 'Available Capacity - Planned Time',
          dataSource: t('insights.data_dailyBreakdown') || 'Daily breakdown',
          interpretation: t('insights.mean_freestDay') || 'Shows how much scheduled work could still be added during working hours.',
          color: 'text-emerald-500'
        };
      }
    },
    mostProductiveDay: {
      supportedGranularities: ['multi'],
      factory: () => {
        const sorted = [...dailyWorkload].sort((a, b) => b.actual - a.actual);
        const day = sorted[0];
        if (!day || day.actual === 0) return {
          name: t('insights.mostProductiveDay') || 'Most Productive Day',
          value: t('insights.noData') || 'No data',
          definition: t('insights.def_mostProductiveDay') || 'The day where you logged the most actual time.', formula: t('insights.form_mostProductiveDay') || 'Max(Actual Time)', dataSource: t('insights.data_timeEntries') || 'Time Entries', interpretation: t('insights.mean_mostProductiveDay') || 'Identifies peak output days.', color: 'text-muted-foreground'
        };
        return {
          name: t('insights.mostProductiveDay') || 'Most Productive Day',
          value: `${day.date.toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })} — ${formatDuration(day.actual)}`,
          definition: t('insights.def_mostProductiveDay') || 'The day where you logged the most actual time.',
          formula: t('insights.form_mostProductiveDay') || 'Max(Actual Time)',
          dataSource: t('insights.data_timeEntries') || 'Time Entries',
          interpretation: t('insights.mean_mostProductiveDay') || 'Identifies peak output days.',
          color: 'text-primary'
        };
      }
    },
    mostTimeConsumingCategory: {
      supportedGranularities: ['single', 'multi'],
      factory: () => {
        const catTotals: Record<string, number> = {};
        stats.catEntries.forEach((te: any) => {
          const task = stats.catTasks.find((t: any) => t.id === te.taskId);
          if (task) {
            catTotals[task.categoryId || 'none'] = (catTotals[task.categoryId || 'none'] || 0) + te.duration;
          }
        });
        let maxCat = '';
        let maxVal = 0;
        Object.keys(catTotals).forEach(k => {
          if (catTotals[k] > maxVal) {
            maxVal = catTotals[k];
            maxCat = k;
          }
        });
        
        let categoryName = maxCat;
        // In a real app we would map this to category list, for now we just show ID or "No data"
        if (!maxCat || maxVal === 0) {
          return {
            name: t('insights.mostTimeConsumingCategory') || 'Most Time-Consuming Category',
            value: t('insights.noData') || 'No data',
            definition: t('insights.def_mostTimeConsumingCategory'), formula: t('insights.form_mostTimeConsumingCategory'), dataSource: t('insights.data_timeEntries') || 'Time Entries', interpretation: t('insights.mean_mostTimeConsumingCategory'), color: 'text-muted-foreground'
          };
        }
        
        return {
          name: t('insights.mostTimeConsumingCategory') || 'Most Time-Consuming Category',
          value: `${maxCat !== 'none' ? maxCat : 'Uncategorized'} — ${formatDuration(maxVal)}`,
          definition: t('insights.def_mostTimeConsumingCategory') || 'The category where you spent the most actual time.',
          formula: t('insights.form_mostTimeConsumingCategory') || 'Category with highest sum of Actual Time',
          dataSource: t('insights.data_timeEntries') || 'Time Entries',
          interpretation: t('insights.mean_mostTimeConsumingCategory') || 'Shows where your time actually goes.',
          color: 'text-foreground'
        };
      }
    },
    mostCompletedCategory: {
      supportedGranularities: ['single', 'multi'],
      factory: () => null
    },
    highestWorkloadPeriod: {
      supportedGranularities: ['multi'],
      factory: () => null
    },
    mostOverloadedDay: {
      supportedGranularities: ['multi'],
      factory: () => {
        const sorted = [...dailyWorkload].map(d => ({...d, overload: Math.max(0, d.planned - d.available)})).sort((a, b) => b.overload - a.overload);
        const day = sorted[0];
        if (!day || day.overload === 0) return {
          name: t('insights.mostOverloadedDay') || 'Most Overloaded Day',
          value: t('insights.noOverloadedDay') || 'No overloaded day',
          definition: t('insights.def_mostOverloadedDay'), formula: t('insights.form_mostOverloadedDay'), dataSource: t('insights.data_dailyBreakdown') || 'Daily breakdown', interpretation: t('insights.mean_mostOverloadedDay'), color: 'text-muted-foreground'
        };
        return {
          name: t('insights.mostOverloadedDay') || 'Most Overloaded Day',
          value: `${day.date.toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })} — ${formatDuration(day.overload)}`,
          definition: t('insights.def_mostOverloadedDay') || 'The day where scheduled work exceeds available capacity the most.',
          formula: t('insights.form_mostOverloadedDay') || 'Max(Planned Time - Available Capacity)',
          dataSource: t('insights.data_dailyBreakdown') || 'Daily breakdown',
          interpretation: t('insights.mean_mostOverloadedDay') || 'Identifies days where you scheduled more work than your available capacity.',
          color: 'text-red-500'
        };
      }
    },
    plannedVsActual: {
      supportedGranularities: ['single', 'multi'],
      factory: () => {
        const variance = stats.actualTime - stats.plannedTime;
        const isPositive = variance > 0;
        return {
          name: t('insights.plannedVsActual') || 'Planned vs Actual',
          value: `${isPositive ? '+' : (variance === 0 ? '' : '-')}${formatDuration(Math.abs(variance))}`,
          definition: t('insights.def_plannedVsActual') || 'The difference between actual time spent and planned time.',
          formula: t('insights.form_plannedVsActual') || 'Actual Time - Planned Time',
          dataSource: t('insights.data_taskDurations') || 'Task durations & Time Entries',
          interpretation: t('insights.mean_plannedVsActual') || 'Shows whether you spent more or less time than planned.',
          color: variance > 0 ? 'text-orange-500' : 'text-emerald-500'
        };
      }
    },
    avgDailyActual: {
      supportedGranularities: ['multi'],
      factory: () => {
        const days = dailyWorkload.length || 1;
        return {
          name: t('insights.avgDailyActual') || 'Average Daily Actual Time',
          value: formatDuration(Math.round(stats.actualTime / days)),
          definition: t('insights.def_avgDailyActual') || 'Average actual time spent per day in the selected period.',
          formula: t('insights.form_avgDailyActual') || 'Total Actual Time / Days in period',
          dataSource: t('insights.data_timeEntries') || 'Time Entries',
          interpretation: t('insights.mean_avgDailyActual') || 'Useful for understanding daily baseline output.',
          color: 'text-foreground'
        };
      }
    },
    avgDailyPlanned: {
      supportedGranularities: ['multi'],
      factory: () => {
        const days = dailyWorkload.length || 1;
        return {
          name: t('insights.avgDailyPlanned') || 'Average Daily Planned Time',
          value: formatDuration(Math.round(stats.plannedTime / days)),
          definition: t('insights.def_avgDailyPlanned') || 'Average scheduled time per day in the selected period.',
          formula: t('insights.form_avgDailyPlanned') || 'Total Planned Time / Days in period',
          dataSource: t('insights.data_scheduledTasks') || 'Scheduled Tasks',
          interpretation: t('insights.mean_avgDailyPlanned') || 'Useful for understanding your typical daily commitment.',
          color: 'text-foreground'
        };
      }
    }
  };

  const renderedInsights = enabledList
    .map(id => {
      const def = insightsMap[id];
      if (!def) return null;
      // Filter out if granularity does not match
      if (isMultiDay && !def.supportedGranularities.includes('multi')) return null;
      if (!isMultiDay && !def.supportedGranularities.includes('single')) return null;
      
      const data = def.factory();
      if (!data) return null;
      return { id, ...data };
    })
    .filter(Boolean);

  if (renderedInsights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">{t('dashboard.productivityInsights') || 'Productivity Insights'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {renderedInsights.map((insight: any) => (
          <div key={insight.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative group flex flex-col h-full">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center">
                  {insight.name}
                  <button onClick={() => toggleExpand(insight.id)} className="ml-2 text-muted-foreground hover:text-primary transition-colors">
                    <Info className="w-4 h-4" />
                  </button>
                </h4>
                <div className={cn("text-2xl font-black mt-1", insight.color)}>
                  {insight.value}
                </div>
              </div>
            </div>
            
            {showDesc && !expandedInsight && (
              <div className="mt-2 text-xs text-muted-foreground">
                {insight.definition}
              </div>
            )}

            {expandedInsight === insight.id && (
              <div className="mt-4 pt-4 border-t border-border/50 text-xs space-y-2 animate-in fade-in slide-in-from-top-2">
                <div>
                  <strong className="text-foreground">{t('insights.definition') || 'Definition'}:</strong>
                  <div className="text-muted-foreground mt-0.5">{insight.definition}</div>
                </div>
                <div>
                  <strong className="text-foreground">{t('insights.formula') || 'Formula'}:</strong>
                  <div className="text-muted-foreground mt-0.5 bg-muted/30 p-1.5 rounded mt-1 font-mono">{insight.formula}</div>
                </div>
                <div>
                  <strong className="text-foreground">{t('insights.dataSource') || 'Data Source'}:</strong>
                  <div className="text-muted-foreground mt-0.5">{insight.dataSource}</div>
                </div>
                <div>
                  <strong className="text-foreground">{t('insights.interpretation') || 'Meaning'}:</strong>
                  <div className="text-muted-foreground mt-0.5">{insight.interpretation}</div>
                </div>
                <button 
                  onClick={() => setExpandedInsight(null)}
                  className="text-primary font-bold hover:underline mt-2 inline-block"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
