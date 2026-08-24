import React from 'react';
import { Sun, Moon, Monitor, Sparkles, Heart } from 'lucide-react';
import { cn } from '../lib/utils';

interface ThemeSwitcherProps {
  currentTheme: string;
  onChange: (theme: string) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onChange }) => {
  const themes = [
    { id: 'light', icon: Sun, title: 'Light' },
    { id: 'dark', icon: Moon, title: 'Dark' },
    { id: 'system', icon: Monitor, title: 'System' },
    { id: 'cute', icon: Sparkles, title: 'Cute' },
    { id: 'pink', icon: Heart, title: 'Pink' },
  ];

  return (
    <div className="flex bg-muted/50 p-1 rounded-full border border-border">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          title={t.title}
          className={cn(
            "p-2 rounded-full transition-colors",
            currentTheme === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <t.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};
