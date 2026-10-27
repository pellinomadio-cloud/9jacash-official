import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isLight: boolean;
  isDaytime: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '9jacash_theme_mode';
const THEME_MANUAL_FLAG = '9jacash_theme_manual_override';

// 6:00 AM (06:00) to 5:59 PM (17:59) is Daytime -> Light mode
// 6:00 PM (18:00) to 5:59 AM (05:59) is Nighttime -> Dark mode
export const getTimeBasedTheme = (): Theme => {
  const currentHour = new Date().getHours();
  return currentHour >= 6 && currentHour < 18 ? 'light' : 'dark';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const isManual = sessionStorage.getItem(THEME_MANUAL_FLAG) === 'true';
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (isManual && (saved === 'light' || saved === 'dark')) {
          return saved;
        }
      } catch {
        // Ignore storage error
      }
    }
    // Default automatically to light mode during day time and dark mode at night
    return getTimeBasedTheme();
  });

  const applyThemeToDOM = (activeTheme: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    if (activeTheme === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      body.classList.add('light-mode');
      body.classList.remove('dark');
    } else {
      root.classList.remove('light-mode');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      body.classList.remove('light-mode');
      body.classList.add('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      sessionStorage.setItem(THEME_MANUAL_FLAG, 'true');
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
    applyThemeToDOM(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // Synchronize with DOM
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Periodically check day/night schedule (every 60s and on app visibility)
  // so app transitions naturally without reload when crossing 6:00 AM or 6:00 PM
  useEffect(() => {
    const checkSchedule = () => {
      // If user hasn't explicitly clicked manual switch in this session, stay synced with time
      const isManual = typeof window !== 'undefined' && sessionStorage.getItem(THEME_MANUAL_FLAG) === 'true';
      if (!isManual) {
        const expected = getTimeBasedTheme();
        if (expected !== theme) {
          setThemeState(expected);
          applyThemeToDOM(expected);
        }
      }
    };

    // Check immediately on mount
    checkSchedule();

    const interval = setInterval(checkSchedule, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkSchedule();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [theme]);

  const currentHour = new Date().getHours();
  const isDaytime = currentHour >= 6 && currentHour < 18;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isLight: theme === 'light',
        isDaytime,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
