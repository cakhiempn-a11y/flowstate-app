import React, { useState, useEffect } from 'react';
import { parseTimeString, formatTimeString } from '../lib/utils';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { cn } from '../lib/utils';

interface TimeInputProps {
  value: string; // HH:MM
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function TimeInput({ value, onChange, disabled, className, placeholder }: TimeInputProps) {
  const { language } = useTranslation();
  const timeFormat = useStore(s => s.settings?.timeFormat) || '24h';
  
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatTimeString(value, timeFormat, language));
    }
  }, [value, timeFormat, language, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseTimeString(inputValue);
    if (parsed) {
      onChange(parsed);
      setInputValue(formatTimeString(parsed, timeFormat, language));
    } else {
      setInputValue(formatTimeString(value, timeFormat, language));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setInputValue(value); // Show 24h format for easier editing
  };

  return (
    <input
      type="text"
      disabled={disabled}
      value={inputValue}
      onChange={e => setInputValue(e.target.value)}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder || '09:00'}
      className={cn("bg-background outline-none", className)}
    />
  );
}
