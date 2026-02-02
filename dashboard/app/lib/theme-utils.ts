/**
 * Simplified theme utilities for tasks-ng
 * Uses prefers-color-scheme for system mode (no sun calculations)
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme-preference';

/**
 * Get stored theme preference from localStorage
 */
export function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/**
 * Store theme preference in localStorage
 */
export function setStoredPreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, preference);
}

/**
 * Check if the system prefers dark mode using matchMedia
 */
export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resolve the actual theme based on preference
 * System mode uses matchMedia('prefers-color-scheme: dark')
 */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  // System mode - use OS preference
  return systemPrefersDark() ? 'dark' : 'light';
}

/**
 * Apply theme class to document.documentElement
 * Toggles 'dark' class for Tailwind dark mode
 */
export function applyThemeClass(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
