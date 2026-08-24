import React from 'react';
import { DynamicIcon } from './DynamicIcon';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export function Doodle({ name, className, ...props }: { name: string, className?: string, [key: string]: any }) {
  const theme = useStore(s => s.settings?.theme);
  
  // Show doodle ONLY if the active theme is cute (or if the system theme resolves to cute, though our system theme only resolves to dark/light)
  if (theme !== 'cute') return null;
  
  return (
    <div className={cn("absolute text-primary/30 pointer-events-none", className)} {...props}>
      <DynamicIcon name={name} size={48} strokeWidth={1.5} />
    </div>
  );
}
