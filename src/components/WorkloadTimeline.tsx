import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../i18n/useTranslation';
import { formatTimeString, getPriorityColor, formatDuration } from '../lib/utils';
import { Task } from '../types';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { isSameDay, parseISO } from 'date-fns';

interface WorkloadTimelineProps {
  days: any[];
  intervalMinutes: number;
  timeFormat: '12h' | '24h';
}

function parseTimeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function WorkloadTimeline({ days, intervalMinutes, timeFormat }: WorkloadTimelineProps) {
  const { t, language } = useTranslation();
  const categories = useStore(s => s.categories);

  // 00:00 to 24:00

  const [hoveredData, setHoveredData] = useState<any>(null);
  const hoverTimeout = useRef<any>(null);

  const handleMouseEnterEmpty = (e: React.MouseEvent, day: any, startMins: number, endMins: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setHoveredData({ type: 'empty', rect, day, startMins, endMins });
    }, 150);
  };

  const handleMouseEnterTask = (e: React.MouseEvent, day: any, task: any, priorityClass: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setHoveredData({ type: 'task', rect, day, task, priorityClass });
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setHoveredData(null);
    }, 100);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (hoveredData) {
         setHoveredData(null);
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [hoveredData]);

  const intervals = useMemo(() => {
    const list = [];
    for (let i = 0; i < 24 * 60; i += intervalMinutes) {
      list.push(i);
    }
    return list;
  }, [intervalMinutes]);

  const formatIntervalLabel = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    return formatTimeString(timeStr, timeFormat, language);
  };

  const getMajorLabelFreq = (interval: number) => {
    if (interval <= 30) return 120; // Every 2 hours
    if (interval === 60) return 120; // Every 2 hours
    return interval; 
  };
  const majorFreq = getMajorLabelFreq(intervalMinutes);

  const renderTimelineHeader = () => {
    return (
      <div className="flex text-[10px] font-bold text-muted-foreground mb-1 relative h-6">
        <div className="w-24 md:w-32 shrink-0" /> {/* Spacer for day label */}
        <div className="flex-1 flex relative">
          {intervals.map((startMins, i) => {
            const isMajor = startMins % majorFreq === 0;
            return (
              <div key={startMins} className="flex-1 relative border-l border-transparent">
                {isMajor && (
                  <div className="absolute left-0 -translate-x-1/2 -top-1 whitespace-nowrap z-10 bg-background px-1">
                    {formatIntervalLabel(startMins)}
                  </div>
                )}
              </div>
            );
          })}
          {/* End label 24:00 */}
          <div className="absolute right-0 translate-x-1/2 -top-1 whitespace-nowrap z-10 bg-background px-1">
             {formatIntervalLabel(0)} 
          </div>
        </div>
      </div>
    );
  };

  const renderRow = (day: any) => {
    const isToday = isSameDay(day.date, new Date());
    const sortedTasks = [...day.tasks].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    return (
      <div 
        key={day.dateStr} 
        className={cn(
          "flex items-stretch text-sm group/row border-b border-border/40 last:border-0",
          isToday && "bg-muted/10 ring-1 ring-inset ring-primary/20 rounded-sm"
        )}
      >
        {/* Fixed Day Label */}
        <div className="w-24 md:w-32 shrink-0 font-bold text-foreground py-3 pr-2 flex flex-col justify-center sticky left-0 bg-background group-hover/row:bg-muted/50 z-20 border-r border-border/50">
          <span className="text-[13px] md:text-sm truncate">{day.name}</span>
          <span className="text-[10px] md:text-[11px] text-muted-foreground truncate">{day.date.toLocaleDateString(language, { month: 'short', day: 'numeric' })}</span>
        </div>
        

        {/* Grid Cells */}
        <div className="flex-1 flex space-x-[2px] bg-border/20 p-[2px] relative">
          {/* Current Time Indicator for Today */}
          {isToday && (
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-[70] pointer-events-none"
              style={{ left: `${( (new Date().getHours() * 60 + new Date().getMinutes()) / (24 * 60) ) * 100}%` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
            </div>
          )}

          {intervals.map((startMins) => {

            const endMins = startMins + intervalMinutes;
            
            // Find tasks intersecting this cell
            const cellTasks = sortedTasks.filter(t => {
              const tStart = parseTimeToMinutes(t.startTime);
              const tEnd = parseTimeToMinutes(t.endTime);
              return tStart < endMins && tEnd > startMins;
            });

            return (
              <div 
                key={startMins} 
                className="flex-1 h-12 md:h-14 relative group/cell bg-background hover:bg-muted/80 transition-colors rounded-[2px]"
                onMouseEnter={cellTasks.length === 0 ? (e) => handleMouseEnterEmpty(e, day, startMins, endMins) : undefined}
                onMouseLeave={cellTasks.length === 0 ? handleMouseLeave : undefined}
              >
                {/* Empty cell tooltip managed via portal */}

                {/* Task Segments */}
                <div className="absolute inset-0 flex flex-col justify-end space-y-[1px] p-[1px]">
                  {cellTasks.map((task) => {
                    const tStart = parseTimeToMinutes(task.startTime);
                    const tEnd = parseTimeToMinutes(task.endTime);
                    
                    const segmentStart = Math.max(tStart, startMins);
                    const segmentEnd = Math.min(tEnd, endMins);
                    const durationInCell = segmentEnd - segmentStart;
                    
                    const widthPct = (durationInCell / intervalMinutes) * 100;
                    const leftPct = ((segmentStart - startMins) / intervalMinutes) * 100;
                    
                    const priorityClass = getPriorityColor(task.priority); 
                    const bgMatches = priorityClass.match(/bg-[a-z]+-[0-9]+/g);
                    const bgMain = bgMatches && bgMatches.length > 0 ? bgMatches[0] : (priorityClass.includes('bg-primary') ? 'bg-primary' : 'bg-foreground');

                    return (
                      <div 
                        key={task.id}
                        className="relative flex-1 rounded-[2px] min-h-[4px] group/segment cursor-pointer"
                        onMouseEnter={(e) => handleMouseEnterTask(e, day, task, priorityClass)}
                        onMouseLeave={handleMouseLeave}
                        style={{
                          width: `${widthPct}%`,
                          marginLeft: `${leftPct}%`,
                        }}
                      >
                         <div className={cn("absolute inset-0 rounded-[2px] opacity-90 group-hover/segment:opacity-100 transition-opacity shadow-sm", bgMain)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (days.every(d => !d.tasks || d.tasks.length === 0)) {
    return (
      <div className="w-full py-8 text-center text-muted-foreground text-sm font-medium">
        {t('dashboard.noTasksTimeline') || 'No tasks scheduled in this period.'}
      </div>
    );
  }

  return (
    <div className="w-full">
      {hoveredData && (
        <TooltipPortal 
          data={hoveredData} 
          t={t} 
          language={language} 
          timeFormat={timeFormat} 
          categories={categories} 
          formatIntervalLabel={formatIntervalLabel} 
        />
      )}
      <div className="flex items-center justify-end space-x-4 mb-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-[2px] bg-emerald-500 opacity-90"></div>
          <span>{t('priority.low') || 'Low'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-[2px] bg-primary opacity-90"></div>
          <span>{t('priority.medium') || 'Medium'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-[2px] bg-orange-500 opacity-90"></div>
          <span>{t('priority.high') || 'High'}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-[2px] bg-red-500 opacity-90"></div>
          <span>{t('priority.urgent') || 'Urgent'}</span>
        </div>
        <div className="flex items-center space-x-1.5 ml-4 pl-4 border-l border-border/50">
          <div className="w-3 h-3 rounded-[2px] bg-border/20 border border-border/50"></div>
          <span>{t('dashboard.freeTime') || 'Free Time'}</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4">
        <div className="w-full pr-4" style={{ minWidth: `${Math.max(800, intervals.length * 15)}px` }}>
          {renderTimelineHeader()}
          <div className="flex flex-col border border-border/50 rounded-lg overflow-hidden shadow-sm">
            {days.map(day => renderRow(day))}
          </div>
        </div>
      </div>
    </div>
  );
}


function TooltipPortal({ data, t, language, timeFormat, categories, formatIntervalLabel }: any) {
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data) return;
    const tooltipRect = ref.current.getBoundingClientRect();
    const targetRect = data.rect;
    
    let top = targetRect.top - tooltipRect.height - 8;
    let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
    
    // Horizontal bounds
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    
    // Vertical bounds (flip below if too close to top)
    if (top < 10) {
      top = targetRect.bottom + 8;
    }
    
    setStyle({ top, left, opacity: 1 });
  }, [data]);

  if (!data) return null;

  const content = (
    <div 
      ref={ref}
      className="fixed z-[9999] pointer-events-none transition-opacity duration-150"
      style={{ ...style }}
    >
      <div className="bg-card text-card-foreground border border-border shadow-xl rounded-xl p-3 md:p-4 text-xs font-normal max-w-[280px] w-max whitespace-normal break-words flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        {data.type === 'empty' ? (
          <>
            <div className="font-bold text-[14px] mb-1">{data.day.date.toLocaleDateString(language, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
            <div className="text-muted-foreground mt-1 font-mono text-[13px] bg-muted/30 px-1.5 py-0.5 rounded w-max">
              {formatIntervalLabel(data.startMins)} - {formatIntervalLabel(data.endMins)}
            </div>
            <div className="mt-2 text-foreground font-semibold">
               {t('dashboard.freeTime') || 'Free time'}
            </div>
          </>
        ) : (
          <>
            <div className="font-bold text-[15px] mb-1.5 leading-snug">{data.task.title}</div>
            
            <div className="text-muted-foreground mb-3 pb-3 border-b border-border/60 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[13px] bg-muted/30 px-1.5 py-0.5 rounded text-foreground font-medium">{formatTimeString(data.task.startTime, timeFormat, language)}</span>
              <span>-</span>
              <span className="font-mono text-[13px] bg-muted/30 px-1.5 py-0.5 rounded text-foreground font-medium">{formatTimeString(data.task.endTime, timeFormat, language)}</span>
              <span className="font-semibold text-primary ml-1 whitespace-nowrap">
                ({formatDuration(parseTimeToMinutes(data.task.endTime) - parseTimeToMinutes(data.task.startTime))})
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="w-20 text-muted-foreground font-medium">{t('tasks.priority') || 'Priority'}:</span>
                <span className={cn("px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider", data.priorityClass)}>
                  {t('priority.' + data.task.priority.toLowerCase()) || data.task.priority}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-20 text-muted-foreground font-medium">{t('tasks.category') || 'Category'}:</span>
                <span className="font-medium text-foreground">{data.task.categoryId ? (categories.find((c: any) => c.id === data.task.categoryId)?.name || data.task.categoryId) : 'Uncategorized'}</span>
              </div>
              <div className="flex items-start">
                <span className="w-20 text-muted-foreground font-medium">{t('tasks.status') || 'Status'}:</span>
                <span className="font-medium text-foreground capitalize">{t('status.' + (data.task.status === 'Not Started' ? 'notStarted' : data.task.status === 'In Progress' ? 'inProgress' : data.task.status.toLowerCase())) || data.task.status}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

