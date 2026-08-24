import React, { useState, useEffect, useRef } from 'react';
import { format, startOfDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay, isToday } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { cn } from '../lib/utils';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className, required, disabled, minDate, maxDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => value ? parseISO(value) : new Date());
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (value) {
      setCurrentMonth(parseISO(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 350; // approximate
      
      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX;
      
      if (top + popoverHeight > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - popoverHeight - 8;
      }
      
      setPopoverStyle({
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999, // higher than modal
      });
    }
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleSelectDate = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const renderHeader = () => {
    const monthNames = {
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      vi: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
      zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    };
    
    const lang = (monthNames[language as keyof typeof monthNames] ? language : 'en') as keyof typeof monthNames;
    const monthName = monthNames[lang][currentMonth.getMonth()];
    const year = currentMonth.getFullYear();
    
    const displayStr = language === 'zh' || language === 'ko' ? `${year} ${monthName}` : `${monthName} ${year}`;

    return (
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={handlePrevMonth} 
          type="button"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="font-bold text-sm text-foreground">
          {displayStr}
        </div>
        <button 
          onClick={handleNextMonth} 
          type="button"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderDays = () => {

    const minDateObj = minDate ? startOfDay(minDate) : null;
    const maxDateObj = maxDate ? startOfDay(maxDate) : null;

    const isDateDisabled = (d: Date) => {
      const dStart = startOfDay(d);
      if (minDateObj && dStart < minDateObj) return true;
      if (maxDateObj && dStart > maxDateObj) return true;
      return false;
    };

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const startDate = start.getDay(); // 0 is Sunday
    
    const days = [];
    const weekdaysEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const weekdaysVi = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weekdaysZh = ['日', '一', '二', '三', '四', '五', '六'];
    const weekdaysKo = ['일', '월', '화', '수', '목', '금', '토'];
    
    const weekdaysMap = {
      en: weekdaysEn,
      vi: weekdaysVi,
      zh: weekdaysZh,
      ko: weekdaysKo
    };
    
    const lang = (weekdaysMap[language as keyof typeof weekdaysMap] ? language : 'en') as keyof typeof weekdaysMap;
    const weekdays = weekdaysMap[lang];

    // Note: this implementation uses Sunday as start of week.
    // FlowState might have weekStartsOn in settings, but for simple date picker, standard local or Sunday is often fine.
    // Let's stick to Sunday start for simplicity or derive it.
    
    // Add weekday headers
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} className="text-center font-bold text-xs text-muted-foreground py-1">
          {weekdays[i]}
        </div>
      );
    }
    
    // Previous month padding
    const prevMonthEnd = endOfMonth(subMonths(currentMonth, 1));
    for (let i = 0; i < startDate; i++) {
      const d = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), prevMonthEnd.getDate() - startDate + i + 1);
      const disabled = minDateObj || maxDateObj ? isDateDisabled(d) : false;
      days.push(
        <button
          key={`prev-${i}`}
          type="button"
          onClick={() => {
            if (!disabled) handleSelectDate(d);
          }}
          disabled={disabled}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs text-muted-foreground/30 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          {d.getDate()}
        </button>
      );
    }
    
    // Current month days
    const currentDays = eachDayOfInterval({ start, end });
    const selectedDateObj = value ? parseISO(value) : null;
    
    currentDays.forEach(d => {
      const isSelected = selectedDateObj && isSameDay(d, selectedDateObj);
      const isTodayDate = isToday(d);
      const disabled = isDateDisabled(d);
      
      days.push(
        <button
          key={d.toISOString()}
          type="button"
          onClick={() => {
            if (!disabled) handleSelectDate(d);
          }}
          disabled={disabled}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed",
            isSelected 
              ? "bg-primary text-primary-foreground font-bold shadow-sm" 
              : isTodayDate
                ? "bg-primary/10 text-primary font-bold hover:bg-primary/20"
                : "text-foreground hover:bg-muted"
          )}
        >
          {d.getDate()}
        </button>
      );
    });
    
    // Next month padding
    const totalCells = days.length; // Headers (7) + Prev + Current
    const remainingCells = 49 - totalCells; // 6 rows * 7 + 7 headers = 49
    for (let i = 0; i < remainingCells; i++) {
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i + 1);
      const disabled = minDateObj || maxDateObj ? isDateDisabled(d) : false;
      days.push(
        <button
          key={`next-${i}`}
          type="button"
          onClick={() => {
            if (!disabled) handleSelectDate(d);
          }}
          disabled={disabled}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs text-muted-foreground/30 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          {d.getDate()}
        </button>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    );
  };

  const displayValue = value ? format(parseISO(value), 'PPP') : ''; // e.g. Apr 29, 2023

  // For proper portal usage
  const popover = isOpen ? createPortal(
    <div 
      ref={popoverRef}
      style={popoverStyle}
      className="bg-card border border-border shadow-xl rounded-xl p-4 w-72 animate-in fade-in zoom-in-95 duration-200"
    >
      {renderHeader()}
      {renderDays()}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full bg-background border border-border rounded-xl px-4 py-3 text-sm flex items-center justify-between transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen ? "border-primary ring-1 ring-primary" : "focus:border-primary focus:ring-1 focus:ring-primary",
          className
        )}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value ? value : (t('common.selectDate') || "Select date")}
        </span>
        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
      </button>
      {popover}
    </>
  );
};
