import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Option {
  value: string | number;
  label: React.ReactNode;
}

interface SelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  className?: string;
  disabled?: boolean;
}

export function Select({ value, onChange, options, className, disabled }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, position: 'bottom' });

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    const estimatedHeight = 260; // max-h-60 is 240px + some padding
    let position = 'bottom';
    let top = rect.bottom + 4; // 4px margin
    
    if (rect.bottom + estimatedHeight > windowHeight && rect.top - estimatedHeight > 0) {
      position = 'top';
      top = rect.top - 4;
    }
    
    setCoords({
      left: rect.left,
      top,
      width: rect.width,
      position
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      
      const handleScroll = (e: Event) => {
        // Don't close if scrolling inside the dropdown
        if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
          return;
        }
        setIsOpen(false);
      };
      
      const handleResize = () => {
        updatePosition();
      };

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          containerRef.current && 
          !containerRef.current.contains(target) &&
          dropdownRef.current && 
          !dropdownRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
          triggerRef.current?.focus();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currentIndex = options.findIndex(opt => opt.value == value);
          const nextIndex = (currentIndex + 1) % options.length;
          onChange(options[nextIndex].value);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const currentIndex = options.findIndex(opt => opt.value == value);
          const prevIndex = (currentIndex - 1 + options.length) % options.length;
          onChange(options[prevIndex].value);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
        } else if (e.key === 'Tab') {
          setIsOpen(false);
        }
      };

      // true for capturing phase to catch scroll events on any scrollable container
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value == value);

  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const dropdownMenu = isOpen ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: coords.position === 'bottom' ? coords.top : undefined,
        bottom: coords.position === 'top' ? window.innerHeight - coords.top : undefined,
        left: coords.left,
        width: coords.width,
      }}
      className={cn(
        "z-[9999] bg-card border border-border rounded-xl shadow-lg overflow-hidden",
        coords.position === 'bottom' ? "animate-in fade-in slide-in-from-top-2 duration-200" : "animate-in fade-in slide-in-from-bottom-2 duration-200"
      )}
    >
      <div className="max-h-60 overflow-y-auto p-1" role="listbox">
        {options.map((option) => (
          <div
            key={option.value}
            role="option"
            aria-selected={option.value == value}
            onClick={(e) => {
              e.stopPropagation();
              onChange(option.value);
              setIsOpen(false);
            }}
            className={cn(
              "px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors flex items-center",
              option.value == value
                ? "bg-primary text-primary-foreground font-bold"
                : "text-foreground hover:bg-muted"
            )}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={selectedOption?.label ? `Selected ${selectedOption.label}` : "Select an option"}
        disabled={disabled}
        onClick={toggleDropdown}
        className={cn(
          "w-full flex items-center justify-between border border-border rounded-lg text-sm bg-card px-3 py-2 outline-none transition-colors",
          isOpen ? "ring-2 ring-primary border-primary" : "focus:ring-2 focus:ring-primary",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="truncate">{selectedOption?.label ?? value}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground opacity-50 shrink-0 ml-2" />
      </button>
      {dropdownMenu}
    </div>
  );
}
