import { addDays, addWeeks, addMonths, parseISO, isBefore, isAfter, format, setDate, setDay, getDay, getDate, differenceInWeeks, differenceInMonths, differenceInDays } from 'date-fns';
import { RecurringTask, Task } from '../types';

function createOccurrence(rt: RecurringTask, date: Date): Task {
  const dateStr = format(date, 'yyyy-MM-dd');
  return {
    id: `${rt.id}_${dateStr}`,
    recurringTaskId: rt.id,
    originalDate: dateStr,
    title: rt.title,
    description: rt.description,
    categoryId: rt.categoryId,
    priority: rt.priority,
    startTime: rt.startTime,
    endTime: rt.endTime,
    plannedDuration: rt.plannedDuration,
    status: 'Not Started',
    progress: 0,
    date: dateStr,
    createdAt: rt.createdAt,
    updatedAt: rt.updatedAt,
    notes: '',
    reminderEnabled: false,
    deadline: null,
    recurrenceRule: 'None'
  };
}

export function generateOccurrences(
  rt: RecurringTask, 
  viewStart: Date, 
  viewEnd: Date
): Task[] {
  const occurrences: Task[] = [];
  const start = parseISO(rt.startDate);
  const rule = rt.recurrenceRule;
  
  const actualEnd = rule.endType === 'until' && rule.endDate 
    ? (isBefore(parseISO(rule.endDate), viewEnd) ? parseISO(rule.endDate) : viewEnd)
    : viewEnd;

  let current = new Date(start);
  let count = 0;

  // We need to iterate from rt.startDate to calculate occurrences accurately
  // especially for 'count' based rules and 'interval' based rules.
  
  // Failsafe: max 10000 occurrences per task
  const MAX_OCCURRENCES = 10000;

  while (!isAfter(current, actualEnd) && count < MAX_OCCURRENCES) {
    if (rule.endType === 'count' && rule.count !== undefined && count >= rule.count) {
      break;
    }

    let isMatch = false;

    if (rule.frequency === 'daily') {
      const daysDiff = differenceInDays(current, start);
      if (daysDiff % rule.interval === 0) {
        isMatch = true;
      }
    } else if (rule.frequency === 'weekly') {
      const weeksDiff = differenceInWeeks(current, start);
      if (weeksDiff % rule.interval === 0) {
        const day = getDay(current);
        if (rule.daysOfWeek && rule.daysOfWeek.includes(day)) {
          isMatch = true;
        }
      }
    } else if (rule.frequency === 'monthly') {
      const monthsDiff = differenceInMonths(current, start);
      if (monthsDiff % rule.interval === 0) {
        if (rule.dayOfMonth !== undefined) {
          if (getDate(current) === rule.dayOfMonth) {
            isMatch = true;
          }
        } else if (rule.weekOfMonth !== undefined && rule.dayOfWeek !== undefined) {
          const day = getDay(current);
          if (day === rule.dayOfWeek) {
            // Check if it's the Nth weekday
            const d = getDate(current);
            const nth = Math.ceil(d / 7);
            
            if (rule.weekOfMonth === -1) {
              // Is it the last of this day in the month?
              const nextWeek = addDays(current, 7);
              if (nextWeek.getMonth() !== current.getMonth()) {
                isMatch = true;
              }
            } else if (nth === rule.weekOfMonth) {
              isMatch = true;
            }
          }
        }
      }
    }

    if (isMatch) {
      count++;
      if (!isBefore(current, viewStart)) {
        occurrences.push(createOccurrence(rt, current));
      }
    }

    current = addDays(current, 1);
  }

  return occurrences;
}
