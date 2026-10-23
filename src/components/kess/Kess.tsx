import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import type { KessMascotElement, KessMood, KessSize } from '@/lib/kess/kess';

export type { KessMood, KessSize };

type KessProps = {
  mood?: KessMood;
  size?: KessSize;
  /** No humor "normal", a bolinha usa a cor de destaque escolhida no Theme.tsx. */
  followAccent?: boolean;
  noHop?: boolean;
  noFollow?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
  onPoke?: () => void;
};

// O código do mascote (e o Three.js, via CDN) só é baixado quando um <Kess> aparece.
let loader: Promise<unknown> | null = null;
function loadKess() {
  loader ??= import('@/lib/kess/kess.js');
  return loader;
}

function readAccent() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--ctp-accent')
    .trim();
}

function Kess({
  mood = 'normal',
  size,
  followAccent = false,
  noHop = false,
  noFollow = false,
  label = 'Kess, mascote do Kessleru',
  className,
  style,
  onPoke,
}: KessProps) {
  const ref = useRef<KessMascotElement>(null);
  const { theme, accent } = useTheme();
  const [accentColor, setAccentColor] = useState<string>();

  useEffect(() => {
    void loadKess();
  }, []);

  // O ThemeProvider aplica as variáveis CSS no efeito dele; lê a cor no quadro seguinte.
  useEffect(() => {
    if (!followAccent) return;
    const id = requestAnimationFrame(() => setAccentColor(readAccent()));
    return () => cancelAnimationFrame(id);
  }, [followAccent, theme, accent]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onPoke) return;
    el.addEventListener('kess-poke', onPoke);
    return () => el.removeEventListener('kess-poke', onPoke);
  }, [onPoke]);

  return (
    <kess-mascot
      ref={ref}
      mood={mood}
      size={size}
      color={followAccent && mood === 'normal' ? accentColor : undefined}
      no-hop={noHop ? '' : undefined}
      no-follow={noFollow ? '' : undefined}
      aria-label={label}
      className={className}
      style={style}
    />
  );
}

export default Kess;
