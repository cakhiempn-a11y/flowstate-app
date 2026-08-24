import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function Card({ className, ...props }: CardProps) {
  return <div className={cn("bg-card rounded-2xl border border-border shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("p-6 flex flex-col space-y-1.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }) {
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-md font-bold",
    secondary: "bg-muted text-foreground hover:bg-muted font-semibold",
    outline: "border border-border bg-transparent hover:bg-background text-foreground font-semibold",
    ghost: "bg-transparent hover:bg-muted text-foreground font-semibold",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-md font-bold"
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-8 text-lg"
  };
  return (
    <button 
      className={cn("inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)}
      {...props} 
    />
  );
}

export function Badge({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const variants = {
    default: "bg-muted text-foreground",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400 font-bold",
    info: "bg-primary/10 text-primary font-bold",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider", variants[variant], className)}>
      {children}
    </span>
  );
}
export * from './Select';
