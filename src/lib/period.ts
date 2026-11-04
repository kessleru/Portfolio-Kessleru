import { useEffect, useState } from 'react';

/** Os quatro períodos do dia, pela hora de quem visita. O relógio, o Kess e a praia usam este. */
export type Period = 'madrugada' | 'manha' | 'tarde' | 'noite';

export function periodOf(date = new Date()): Period {
  const h = date.getHours();
  if (h < 5) return 'madrugada';
  if (h < 12) return 'manha';
  if (h < 18) return 'tarde';
  return 'noite';
}

export const greetings: Record<Period, string> = {
  madrugada: 'boa madrugada',
  manha: 'bom dia',
  tarde: 'boa tarde',
  noite: 'boa noite',
};

export const greetingsEn: Record<Period, string> = {
  madrugada: 'good night',
  manha: 'good morning',
  tarde: 'good afternoon',
  noite: 'good evening',
};

/** A hora atual, atualizada na virada de cada minuto (no build não há relógio: null). */
export function useNow() {
  const [now, setNow] = useState<Date | null>(() =>
    typeof window === 'undefined' ? null : new Date()
  );

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const d = new Date();
      setNow(d);
      timer = window.setTimeout(
        tick,
        60000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 30
      );
    };
    const d = new Date();
    timer = window.setTimeout(
      tick,
      60000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 30
    );
    // voltando de outra aba, acerta na hora (o setTimeout atrasa em abas escondidas)
    const onVisibility = () => {
      if (!document.hidden) {
        window.clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return now;
}
