"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const SETTINGS_STORAGE_KEY = 'tasks-ng:settings';

export interface AppSettings {
  singleTaskEnforcement: boolean;
  // Future settings added here
}

export const DEFAULT_SETTINGS: AppSettings = {
  singleTaskEnforcement: false,
};

export interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Initialize on mount — read from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed: Partial<AppSettings> = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // localStorage unavailable (private browsing) — use defaults
    }
    setMounted(true);
  }, []);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage unavailable — update in-memory only
      }
      return updated;
    });
  }, []);

  const contextValue: SettingsContextValue = {
    settings,
    updateSetting,
  };

  // Prevent hydration mismatch — render children with defaults until mounted
  if (!mounted) {
    return (
      <SettingsContext.Provider value={{ settings: DEFAULT_SETTINGS, updateSetting }}>
        {children}
      </SettingsContext.Provider>
    );
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
