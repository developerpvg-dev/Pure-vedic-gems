'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

type ThemeContextType = {
  palette: number;
  font: number;
  setPalette: (p: number) => void;
  setFont: (f: number) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  palette: 1,
  font: 1,
  setPalette: () => {},
  setFont: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState(() => {
    if (typeof window === 'undefined') return 1;
    return Number(localStorage.getItem('pvg-palette')) || 1;
  });
  const [font, setFontState] = useState(() => {
    if (typeof window === 'undefined') return 1;
    return Number(localStorage.getItem('pvg-font')) || 1;
  });

  // Apply data attributes to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-palette', String(palette));
  }, [palette]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font', String(font));
  }, [font]);

  const setPalette = useCallback((p: number) => {
    setPaletteState(p);
    localStorage.setItem('pvg-palette', String(p));
  }, []);

  const setFont = useCallback((f: number) => {
    setFontState(f);
    localStorage.setItem('pvg-font', String(f));
  }, []);

  return (
    <ThemeContext.Provider value={{ palette, font, setPalette, setFont }}>
      {children}
    </ThemeContext.Provider>
  );
}
