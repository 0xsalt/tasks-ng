"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ThemePreference, ResolvedTheme } from '@/app/lib/theme-utils';
import {
  resolveTheme,
  getStoredPreference,
  setStoredPreference,
  applyThemeClass
} from '@/app/lib/theme-utils';

interface ThemeContextValue {
  // Current visual theme (after resolution)
  theme: ResolvedTheme;
  // User's preference setting
  preference: ThemePreference;
  // Set preference action
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [theme, setTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const storedPref = getStoredPreference();
    setPreferenceState(storedPref);

    const resolvedTheme = resolveTheme(storedPref);
    setTheme(resolvedTheme);
    applyThemeClass(resolvedTheme);

    setMounted(true);
  }, []);

  // Listen to system preference changes for system mode
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (preference === 'system') {
        const resolvedTheme = resolveTheme('system');
        setTheme(resolvedTheme);
        applyThemeClass(resolvedTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, preference]);

  // Set preference action
  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    setStoredPreference(pref);
    const resolvedTheme = resolveTheme(pref);
    setTheme(resolvedTheme);
    applyThemeClass(resolvedTheme);
  }, []);

  const value: ThemeContextValue = {
    theme,
    preference,
    setPreference,
  };

  // Prevent flash by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
