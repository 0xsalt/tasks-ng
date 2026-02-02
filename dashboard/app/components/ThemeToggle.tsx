"use client";

import { Sun, Moon, SunMoon } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import type { ThemePreference } from '@/app/lib/theme-utils';

/**
 * Theme toggle component - single icon button that cycles through modes
 * Light -> Dark -> System -> Light...
 */
export function ThemeToggle() {
  const { preference, theme, setPreference } = useTheme();

  const cyclePreference = (): ThemePreference => {
    if (preference === 'light') return 'dark';
    if (preference === 'dark') return 'system';
    return 'light';
  };

  const getIcon = () => {
    if (preference === 'light') return <Sun className="w-5 h-5" />;
    if (preference === 'dark') return <Moon className="w-5 h-5" />;
    return <SunMoon className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (preference === 'system') return `System (${theme})`;
    return preference.charAt(0).toUpperCase() + preference.slice(1);
  };

  return (
    <button
      onClick={() => setPreference(cyclePreference())}
      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={`Theme: ${getLabel()} (click to change)`}
      aria-label={`Theme: ${getLabel()}`}
    >
      {getIcon()}
    </button>
  );
}
