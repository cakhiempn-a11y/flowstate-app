import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number | undefined | null): string {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || isNaN(minutes)) {
    return '0m 00s';
  }
  if (minutes < 0) return `-${formatDuration(Math.abs(minutes))}`;
  
  const totalSeconds = Math.floor(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  if (hours === 0) {
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  
  if (secs === 0) {
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  }
  
  return `${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

export function calculateVariance(planned: number, actual: number): number {
  return actual - planned;
}

export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getWorkloadColor(percentage: number): string {
  if (percentage <= 25) return "bg-muted text-foreground border-border";
  if (percentage <= 50) return "bg-primary/10 text-primary border-primary/20";
  if (percentage <= 75) return "bg-primary/20 text-primary border-primary/30";
  if (percentage <= 90) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
}

export function getHeatmapColor(percentage: number): string {
  if (percentage === 0) return "bg-muted";
  if (percentage <= 25) return "bg-primary/20";
  if (percentage <= 50) return "bg-primary/40";
  if (percentage <= 75) return "bg-primary/60";
  if (percentage <= 90) return "bg-primary/80";
  return "bg-red-500/80";
}

export function parseTimeString(val: string): string | null {
  const isPM = val.toLowerCase().includes('p');
  const isAM = val.toLowerCase().includes('a');
  const clean = val.replace(/[^0-9]/g, '');
  
  let h = 0, m = 0;
  if (clean.length === 1 || clean.length === 2) {
    h = parseInt(clean);
  } else if (clean.length === 3) {
    h = parseInt(clean.substring(0, 1));
    m = parseInt(clean.substring(1, 3));
  } else if (clean.length === 4) {
    h = parseInt(clean.substring(0, 2));
    m = parseInt(clean.substring(2, 4));
  } else {
    return null;
  }

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  return null;
}

export function formatTimeString(timeStr: string, timeFormat: '12h' | '24h', localeCode: string = 'en'): string {
  if (!timeStr) return '';
  if (timeFormat === '24h') return timeStr;
  
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function getPriorityColor(priority: string): string {
  if (!priority) return 'bg-primary text-primary-foreground border-primary/50';
  const p = priority.toLowerCase();
  if (p === 'high') return 'bg-orange-500 text-white border-orange-600';
  if (p === 'urgent') return 'bg-red-500 text-white border-red-600';
  if (p === 'medium') return 'bg-primary text-primary-foreground border-primary/50';
  if (p === 'low') return 'bg-emerald-500 text-white border-emerald-600';
  return 'bg-primary text-primary-foreground border-primary/50'; // Default to medium
}
