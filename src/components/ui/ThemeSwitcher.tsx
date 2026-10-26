import { useSyncExternalStore } from 'react';
import Card from '@/components/ui/Cards/Card';
import {
  getKessEnabled,
  setKessEnabled,
  subscribeKess,
} from '@/components/kess/kessPreference';
import {
  PALETTE_COLORS,
  useTheme,
  type ThemeName,
} from '@/components/theme/ThemeProvider';

const THEMES: { label: string; value: ThemeName }[] = [
  { label: 'Latte', value: 'latte' },
  { label: 'Frappé', value: 'frappe' },
  { label: 'Macchiato', value: 'macchiato' },
  { label: 'Mocha', value: 'mocha' },
];

type ThemeSwitcherProps = {
  className?: string;
};

function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const kessEnabled = useSyncExternalStore(
    subscribeKess,
    getKessEnabled,
    () => true
  );

  return (
    <Card fileName="Theme.tsx" className={`w-full ${className}`}>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold">Tema</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {THEMES.map((item) => {
              const active = item.value === theme;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTheme(item.value)}
                  className={`rounded-md border px-2 sm:px-3 py-1.5 text-xs whitespace-nowrap cursor-pointer transition-colors ${
                    active
                      ? 'border-ctp-accent text-ctp-accent bg-ctp-surface-0'
                      : 'border-ctp-overlay-0 text-ctp-subtext-0 hover:text-ctp-text'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Destaque</p>
          <div className="grid grid-cols-7 gap-2">
            {PALETTE_COLORS.map((item) => {
              const colorVar = `--ctp-${item}`;
              const active = item === accent;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAccent(item)}
                  aria-label={item}
                  className={`h-9 rounded-md border-2 cursor-pointer ${
                    active
                      ? 'border-ctp-text ring-2 ring-ctp-accent/70'
                      : 'border-ctp-overlay-0/40'
                  }`}
                  style={{ backgroundColor: `var(${colorVar})` }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p id="kess-toggle-label" className="text-sm font-semibold">
            Kess
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={kessEnabled}
            aria-labelledby="kess-toggle-label"
            onClick={() => setKessEnabled(!kessEnabled)}
            className="flex cursor-pointer items-center gap-2 text-xs text-ctp-subtext-0 transition-colors hover:text-ctp-text"
          >
            {kessEnabled ? 'andando pelo site' : 'escondido'}
            <span
              className={`relative h-5 w-9 rounded-full border transition-colors duration-200 ${
                kessEnabled
                  ? 'border-ctp-accent bg-ctp-accent/25'
                  : 'border-ctp-overlay-0 bg-ctp-surface-0'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-3.5 rounded-full transition-[translate,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  kessEnabled
                    ? 'translate-x-4 bg-ctp-accent'
                    : 'translate-x-0 bg-ctp-overlay-1'
                }`}
              />
            </span>
          </button>
        </div>
      </div>
    </Card>
  );
}

export default ThemeSwitcher;
