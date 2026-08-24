import { useStore } from './useStore';
import { generateOccurrences } from '../lib/recurrence';
import { getEffectiveTaskStatus } from '../lib/taskUtils';
import { parseISO, isAfter, isBefore, format, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { useMemo } from 'react';

// Central hook to fetch tasks, merging standalone tasks, exception occurrences, 
// and dynamically generated recurring occurrences.
export function useTasks(viewStart?: Date, viewEnd?: Date) {
  const tasks = useStore(s => s.tasks);
  const recurringTasks = useStore(s => s.recurringTasks);
  const currentTime = useStore(s => s.currentTime);

  return useMemo(() => {
    // Default window if none provided: -1 year to +2 years from now
    const vs = viewStart || subYears(new Date(), 1);
    const ve = viewEnd || addYears(new Date(), 2);
    
    const allTasks = tasks.map(t => ({
          ...t,
          status: getEffectiveTaskStatus(t, currentTime || Date.now())
        }));
    
    // Map of exceptions for fast lookup
    const exceptionMap = new Set();
    for (const t of tasks) {
      if (t.recurringTaskId && t.originalDate) {
        exceptionMap.add(`${t.recurringTaskId}_${t.originalDate}`);
      }
    }

    for (const rt of recurringTasks || []) {
      const generated = generateOccurrences(rt, vs, ve);
      for (const occ of generated) {
        // If an exception exists for this exact occurrence, skip it
        if (!exceptionMap.has(`${rt.id}_${occ.originalDate}`)) {
          allTasks.push({
            ...occ,
            status: getEffectiveTaskStatus(occ, currentTime || Date.now())
          });
        }
      }
    }
    
    // Filter out skipped tasks from the final returned list, 
    // since 'Skipped' means they shouldn't appear as active/completed tasks in analytics and calendar.
    // However, some views might want to see them. For now, filter them out entirely or leave them?
    // The requirement says: "Skipped occurrences should not count as completed tasks."
    // If they have status 'Skipped', they won't count as 'Completed'. 
    // They can still appear in the UI as skipped.
    
    return allTasks.filter(t => t.status !== 'Skipped' && t.status !== 'Cancelled');
  }, [tasks, recurringTasks, viewStart, viewEnd, currentTime]);
}
