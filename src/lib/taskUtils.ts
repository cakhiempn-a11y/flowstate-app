import { Task, Status } from '../types';
import { parse, isAfter, startOfDay, parseISO } from 'date-fns';

export function getEffectiveTaskStatus(task: Task, now: Date | number): Status {
  if (task.status === 'Completed' || task.status === 'Cancelled' || task.status === 'Skipped') {
    return task.status;
  }

  const currentDate = new Date(now);

  // SCHEDULED TASK
  if (task.date && task.date !== '') {
    // If it has a date but somehow missing endTime, fallback to just checking if the date passed?
    // The prompt says "A task is considered SCHEDULED when it has the existing schedule information used by Calendar, such as: scheduledDate, startTime, endTime"
    if (task.startTime && task.endTime) {
      try {
        const endDateTime = parse(`${task.date} ${task.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
        if (isAfter(currentDate, endDateTime)) {
          return 'Overdue';
        }
      } catch (e) {
        console.warn("Failed to parse scheduled date time for task:", task.id);
      }
    } else {
      // Fallback for scheduled tasks without explicit end time (if any)
      // Usually they do have it. If not, compare end of day.
      try {
        const endDate = parse(task.date, 'yyyy-MM-dd', new Date());
        const endOfEndDate = new Date(endDate);
        endOfEndDate.setHours(23, 59, 59, 999);
        if (isAfter(currentDate, endOfEndDate)) {
          return 'Overdue';
        }
      } catch (e) {
         // ignore
      }
    }
    
    return task.status;
  }

  // UNSCHEDULED TASK
  if ((!task.date || task.date === '') && task.deadline) {
    try {
      const deadlineDate = parseISO(task.deadline);
      const today = startOfDay(currentDate);
      const deadlineStartOfDay = startOfDay(deadlineDate);

      // Overdue starts the next calendar day
      if (isAfter(today, deadlineStartOfDay)) {
        return 'Overdue';
      }
    } catch (e) {
      console.warn("Failed to parse deadline for unscheduled task:", task.id);
    }
    return task.status;
  }

  return task.status;
}
