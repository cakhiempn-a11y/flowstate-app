import { DatePicker } from './DatePicker';
import { Select } from './ui';
import React, { useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { RecurrenceRule } from '../types';
import { format, addDays, startOfWeek } from 'date-fns';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

interface RecurrenceBuilderProps {
  rule: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
  startDate: string; // To default options correctly
}

export function RecurrenceBuilder({ rule, onChange, startDate }: RecurrenceBuilderProps) {
  const { t, dateLocale } = useTranslation();
  const settings = useStore(s => s.settings);

  // Generate weekday names
  const weekdays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: settings?.weekStartsOn || 1 });
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(start, i);
      return { 
        id: d.getDay(), 
        label: format(d, 'EEE', { locale: dateLocale }),
        full: format(d, 'EEEE', { locale: dateLocale })
      };
    });
  }, [settings?.weekStartsOn, dateLocale]);

  if (!rule) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('recurrence.repeat') || 'Repeat'}</label>
        <Select
          value="none"
          onChange={value => {
            if (value === 'daily') {
              onChange({ frequency: 'daily', interval: 1, endType: 'never' });
            } else if (value === 'weekday') {
              onChange({ frequency: 'weekly', interval: 1, daysOfWeek: [1, 2, 3, 4, 5], endType: 'never' });
            } else if (value === 'weekly') {
              const day = new Date(startDate).getDay();
              onChange({ frequency: 'weekly', interval: 1, daysOfWeek: [day], endType: 'never' });
            } else if (value === 'monthly') {
              onChange({ frequency: 'monthly', interval: 1, dayOfMonth: parseInt(startDate.split('-')[2] || '1'), endType: 'never' });
            } else if (value === 'custom') {
              // Just default to daily but open the advanced builder
              onChange({ frequency: 'daily', interval: 1, endType: 'never' });
            }
          }}
          className="w-full"
          options={[
            { value: "none", label: t('recurrence.doesNotRepeat') },
            { value: "daily", label: t('recurrence.everyDay') },
            { value: "weekday", label: t('recurrence.everyWeekday') },
            { value: "weekly", label: t('recurrence.everyWeek') },
            { value: "monthly", label: t('recurrence.everyMonth') },
            { value: "custom", label: t('recurrence.custom') }
          ]}
        />
      </div>
    );
  }

  const toggleDay = (dayId: number) => {
    const days = rule.daysOfWeek || [];
    if (days.includes(dayId)) {
      if (days.length > 1) { // prevent empty
        onChange({ ...rule, daysOfWeek: days.filter(d => d !== dayId) });
      }
    } else {
      onChange({ ...rule, daysOfWeek: [...days, dayId].sort() });
    }
  };

  const getSummary = () => {
    if (rule.frequency === 'daily') {
      return rule.interval === 1 ? t('recurrence.everyDay') || 'Every day' : `${t('recurrence.every') || 'Every'} ${rule.interval} ${t('recurrence.days') || 'days'}`;
    }
    if (rule.frequency === 'weekly') {
      const days = rule.daysOfWeek?.map(d => weekdays.find(w => w.id === d)?.label).join(', ') || '';
      return rule.interval === 1 
        ? `${t('recurrence.weeklyOn') || 'Weekly on'} ${days}`
        : `${t('recurrence.every') || 'Every'} ${rule.interval} ${t('recurrence.weeksOn') || 'weeks on'} ${days}`;
    }
    if (rule.frequency === 'monthly') {
      return `${t('recurrence.monthlyOn') || 'Monthly on the'} ${rule.dayOfMonth}`;
    }
    return '';
  };

  return (
    <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('recurrence.repeat') || 'Repeat'}</label>
        <button 
          onClick={() => onChange(null)}
          className="text-xs font-bold text-red-500 hover:underline"
        >
          {t('common.remove') || 'Remove'}
        </button>
      </div>

      <div className="flex gap-2">
        <Select
          value={rule.frequency}
          onChange={(value) => onChange({ ...rule, frequency: value as any, interval: 1 })}
          className="w-full"
          options={[
            { value: "daily", label: t('recurrence.daily') || 'Daily' },
            { value: "weekly", label: t('recurrence.weekly') || 'Weekly' },
            { value: "monthly", label: t('recurrence.monthly') || 'Monthly' }
          ]}
        />
        
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1">
          <span className="text-xs text-muted-foreground font-semibold">{t('recurrence.every') || 'Every'}</span>
          <input
            type="number"
            min="1"
            max="99"
            value={rule.interval}
            onChange={e => onChange({ ...rule, interval: parseInt(e.target.value) || 1 })}
            className="w-12 text-sm font-bold bg-transparent border-none outline-none text-center"
          />
          <span className="text-xs text-muted-foreground font-semibold">
            {rule.frequency === 'daily' ? (rule.interval === 1 ? t('recurrence.day') || 'day' : t('recurrence.days') || 'days') :
             rule.frequency === 'weekly' ? (rule.interval === 1 ? t('recurrence.week') || 'week' : t('recurrence.weeks') || 'weeks') :
             (rule.interval === 1 ? t('recurrence.month') || 'month' : t('recurrence.months') || 'months')}
          </span>
        </div>
      </div>

      {rule.frequency === 'weekly' && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('recurrence.onDays') || 'On Days'}</label>
          <div className="flex flex-wrap gap-2">
            {weekdays.map(day => {
              const isSelected = rule.daysOfWeek?.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={cn(
                    "w-8 h-8 rounded-full text-xs font-bold transition-colors flex items-center justify-center",
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background border border-border text-muted-foreground hover:bg-muted"
                  )}
                  title={day.full}
                >
                  {day.label.substring(0, 1)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {rule.frequency === 'monthly' && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('recurrence.onDay') || 'On Day'}</label>
          <input
            type="number"
            min="1"
            max="31"
            value={rule.dayOfMonth || 1}
            onChange={e => onChange({ ...rule, dayOfMonth: parseInt(e.target.value) || 1 })}
            className="block w-full text-sm font-semibold bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-border">
        <label className="block text-xs font-semibold text-muted-foreground uppercase">{t('recurrence.ends') || 'Ends'}</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              checked={rule.endType === 'never'}
              onChange={() => onChange({ ...rule, endType: 'never' })}
              className="text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium">{t('recurrence.never') || 'Never'}</span>
          </label>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                checked={rule.endType === 'until'}
                onChange={() => onChange({ ...rule, endType: 'until', endDate: rule.endDate || startDate })}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">{t('recurrence.on') || 'On'}</span>
            </label>
            <DatePicker
              value={rule.endDate || ''}
              onChange={val => onChange({ ...rule, endDate: val })}
              className="w-36 text-sm bg-background border border-border rounded-md px-2 py-1 outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                checked={rule.endType === 'count'}
                onChange={() => onChange({ ...rule, endType: 'count', count: rule.count || 10 })}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">{t('recurrence.after') || 'After'}</span>
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number"
                min="1"
                disabled={rule.endType !== 'count'}
                value={rule.count || ''}
                onChange={e => onChange({ ...rule, count: parseInt(e.target.value) || 1 })}
                className="w-16 text-sm bg-background border border-border rounded-md px-2 py-1 outline-none disabled:opacity-50"
              />
              <span className="text-sm text-muted-foreground">{t('recurrence.occurrences') || 'occurrences'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
         {getSummary()}
      </div>
    </div>
  );
}
