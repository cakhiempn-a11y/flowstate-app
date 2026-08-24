import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { TimeInput } from './TimeInput';

interface TimeRangeInputProps {
  startTime: string;
  endTime: string;
  onChange: (start: string, end: string) => void;
}

const DEFAULT_PRESET_DURATIONS = [
  { key: '15m', value: 15 },
  { key: '30m', value: 30 },
  { key: '45m', value: 45 },
  { key: '1h', value: 60 },
  { key: '1h30m', value: 90 },
  { key: '2h', value: 120 },
];

function calculateDuration(start: string, end: string) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function addMinutes(time: string, mins: number) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  let total = h * 60 + m + mins;
  if (total < 0) total = 0;
  if (total >= 24 * 60) total = 24 * 60 - 1;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

function formatDurationLabel(mins: number): string {
  const hours = Math.floor(mins / 60);
  const m = mins % 60;
  if (hours === 0) return `${m}m`;
  if (m === 0) return `${hours}h`;
  return `${hours}h ${m}m`;
}

export function TimeRangeInput({ startTime, endTime, onChange }: TimeRangeInputProps) {
  const { t } = useTranslation();
  const presets = useStore(s => s.settings?.taskDurationPresets) || [15, 30, 45, 60, 90, 120, 180, 240, 360, 480];
  
  const [durationStr, setDurationStr] = useState('');
  
  useEffect(() => {
    const dur = calculateDuration(startTime, endTime);
    if (dur > 0) {
      if (dur < 60) setDurationStr(`${dur}m`);
      else setDurationStr(`${Math.floor(dur/60)}h ${dur%60 > 0 ? (dur%60)+'m' : ''}`.trim());
    } else {
      setDurationStr('');
    }
  }, [startTime, endTime]);

  const setDuration = (mins: number) => {
    const newEnd = addMinutes(startTime, mins);
    onChange(startTime, newEnd);
  };

  const currentDuration = calculateDuration(startTime, endTime);
  const isInvalid = currentDuration < 0;
  const isPreset = presets.includes(currentDuration);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{t('common.startTime')}</label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <TimeInput 
              value={startTime} 
              onChange={(v) => {
                const dur = calculateDuration(startTime, endTime);
                const newEnd = dur > 0 ? addMinutes(v, dur) : v;
                onChange(v, newEnd);
              }} 
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>
        </div>
        <div className="flex-1 relative">
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">{t('common.endTime')}</label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <TimeInput 
              value={endTime} 
              onChange={(v) => onChange(startTime, v)} 
              className={cn("w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50", isInvalid ? "border-red-500 text-red-600" : "border-border")} 
            />
          </div>
        </div>
      </div>
      
      {isInvalid && (
        <div className="text-xs font-medium text-red-500">
          {t('validation.endTimeBeforeStart')}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase">{t('common.duration')}:</span>
        <div className="flex flex-wrap gap-1.5">
          {presets.slice(0, 8).map(mins => (
            <button
              key={mins}
              type="button"
              onClick={() => setDuration(mins)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors border",
                currentDuration === mins 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              )}
            >
              {formatDurationLabel(mins)}
            </button>
          ))}
          {!isPreset && currentDuration > 0 && (
            <div className="relative flex items-center border border-primary rounded-md bg-primary px-2.5 py-1 text-primary-foreground">
               <span className="text-[11px] font-bold">{durationStr || t('duration.custom')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
