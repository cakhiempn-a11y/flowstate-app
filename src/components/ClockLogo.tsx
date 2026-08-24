import React from 'react';
import { cn } from '../lib/utils';

export function ClockLogo({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={cn("shrink-0", className)}
      fill="none"
      role="img"
      aria-label="FlowState"
    >
      {/* Tiny ears/bells on top for cuteness */}
      <path 
        d="M25 25 Q30 8 42 16" 
        className="stroke-primary fill-primary/20" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M75 25 Q70 8 58 16" 
        className="stroke-primary fill-primary/20" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Clock Face Container */}
      <circle 
        cx="50" 
        cy="55" 
        r="40" 
        className="fill-card dark:fill-slate-800 stroke-primary" 
        strokeWidth="6" 
      />
      
      {/* Cute Eyes */}
      <circle cx="37" cy="48" r="4.5" className="fill-card-foreground" />
      <circle cx="63" cy="48" r="4.5" className="fill-card-foreground" />
      
      {/* Sparkle inside eyes (kawaii detail) */}
      <circle cx="38.5" cy="46.5" r="1.5" className="fill-white dark:fill-slate-900" />
      <circle cx="64.5" cy="46.5" r="1.5" className="fill-white dark:fill-slate-900" />
      
      {/* Cute Blush */}
      <circle cx="28" cy="54" r="4" className="fill-primary opacity-30" />
      <circle cx="72" cy="54" r="4" className="fill-primary opacity-30" />

      {/* Small friendly smile */}
      <path 
        d="M44 56 Q50 62 56 56" 
        className="stroke-card-foreground" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Simple clock hands - playful positions */}
      <path 
        d="M50 55 L50 34" 
        className="stroke-card-foreground" 
        strokeWidth="4.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M50 55 L65 65" 
        className="stroke-card-foreground" 
        strokeWidth="4.5" 
        strokeLinecap="round" 
      />
      
      {/* Center dot */}
      <circle cx="50" cy="55" r="4.5" className="fill-primary" />
    </svg>
  );
}

