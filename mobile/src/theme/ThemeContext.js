import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, layout } from './spacing';
import { shadows } from './shadows';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children, initialMode = 'dark' }) => {
  const [mode, setMode] = useState(initialMode);

  const toggleTheme = useCallback(() => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setThemeMode = useCallback((newMode) => {
    setMode(newMode);
  }, []);

  const theme = useMemo(() => ({
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    typography,
    spacing,
    borderRadius,
    layout,
    shadows,
    isDark: mode === 'dark',
    isLight: mode === 'light',
    toggleTheme,
    setThemeMode,
  }), [mode, toggleTheme, setThemeMode]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
};
