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

/** "sapphire" → "Sapphire": os nomes do Catppuccin, como aparecem na paleta oficial. */
function accentName(color: string) {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme, accent, setAccent } = useTheme();

  // Setas andam pela paleta (dando a volta nas pontas); Home e End vão para a primeira e a última cor.
  function handleSwatchKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = PALETTE_COLORS.indexOf(accent);
    const last = PALETTE_COLORS.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in moves)) return;

    event.preventDefault();
    const next = PALETTE_COLORS[(moves[event.key] + last + 1) % (last + 1)];
    setAccent(next);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-color="${next}"]`)
      ?.focus();
  }

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
                  aria-pressed={active}
                  onClick={() => setTheme(item.value)}
                  className={`key w-full text-xs whitespace-nowrap [--key-px:8px] sm:[--key-px:12px] ${
                    active ? 'accent-chip' : ''
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="swatches-box">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p id="accent-label" className="text-sm font-semibold">
              Destaque
            </p>
            <p className="text-xs text-ctp-meta" aria-hidden="true">
              {accentName(accent)}
            </p>
          </div>
          {/* Um grupo de rádios: Tab entra no selecionado e as setas trocam de cor, como num seletor nativo. */}
          <div
            role="radiogroup"
            aria-labelledby="accent-label"
            className="swatches"
            onKeyDown={handleSwatchKeys}
          >
            {PALETTE_COLORS.map((item) => {
              const active = item === accent;

              return (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={accentName(item)}
                  title={accentName(item)}
                  tabIndex={active ? 0 : -1}
                  data-color={item}
                  onClick={() => setAccent(item)}
                  className="swatch"
                  style={
                    { '--swatch': `var(--ctp-${item})` } as React.CSSProperties
                  }
                >
                  <span className="swatch__fill" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ThemeSwitcher;
