import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeName = 'latte' | 'frappe' | 'macchiato' | 'mocha';
export const PALETTE_COLORS = [
  'rosewater',
  'flamingo',
  'pink',
  'mauve',
  'red',
  'maroon',
  'peach',
  'yellow',
  'green',
  'teal',
  'sky',
  'sapphire',
  'blue',
  'lavender',
] as const;

export type AccentName = (typeof PALETTE_COLORS)[number];

type ThemeContextType = {
  theme: ThemeName;
  accent: AccentName;
  setTheme: (theme: ThemeName) => void;
  setAccent: (accent: AccentName) => void;
};

const THEME_STORAGE_KEY = 'portfolio-theme';
const ACCENT_STORAGE_KEY = 'portfolio-accent';

const ThemeContext = createContext<ThemeContextType | null>(null);

function getStoredTheme(): ThemeName {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (
    storedTheme === 'latte' ||
    storedTheme === 'frappe' ||
    storedTheme === 'macchiato' ||
    storedTheme === 'mocha'
  ) {
    return storedTheme;
  }

  return 'mocha';
}

function getStoredAccent(): AccentName {
  const storedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);

  if (storedAccent && PALETTE_COLORS.includes(storedAccent as AccentName)) {
    return storedAccent as AccentName;
  }

  return 'green';
}

function applyTheme(theme: ThemeName, accent: AccentName) {
  const root = document.documentElement;

  root.setAttribute('data-theme', theme);
  root.style.setProperty('--ctp-accent', `var(--ctp-${accent})`);
}

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeName>(getStoredTheme);
  const [accent, setAccent] = useState<AccentName>(getStoredAccent);

  useEffect(() => {
    applyTheme(theme, accent);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  }, [theme, accent]);

  const value = useMemo(
    () => ({ theme, accent, setTheme, setAccent }),
    [theme, accent]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}
