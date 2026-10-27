import Card from '@/components/ui/Cards/Card';
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
          <div className="flex flex-wrap gap-2.5">
            {PALETTE_COLORS.map((item) => {
              const colorVar = `--ctp-${item}`;
              const active = item === accent;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAccent(item)}
                  aria-label={item}
                  aria-pressed={active}
                  className={`size-7 cursor-pointer rounded-full border-2 transition-[scale] duration-150 hover:scale-110 ${
                    active
                      ? 'border-ctp-mantle ring-2 ring-ctp-text/80'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: `var(${colorVar})` }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ThemeSwitcher;
