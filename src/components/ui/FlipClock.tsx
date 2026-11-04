import { useEffect, useState } from 'react';
import { greetings, periodOf, useNow } from '@/lib/period';

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const FLIP_MS = 600;

/**
 * Uma placa do relógio de flip. Quando o valor muda, a metade de cima com o número velho cai
 * para frente e a de baixo com o número novo desce no lugar, como num relógio de verdade.
 * Enquanto vira, `shown` ainda guarda o número velho; só a virada usa animação (transform).
 */
function Flap({ value }: { value: string }) {
  const [shown, setShown] = useState(value);
  const flipping = shown !== value;

  useEffect(() => {
    if (!flipping) return;
    const t = window.setTimeout(() => setShown(value), FLIP_MS);
    return () => window.clearTimeout(t);
  }, [flipping, value]);

  return (
    <span className="flap">
      <span className="flap__half flap__half--top">
        <span className="flap__digits">{value}</span>
      </span>
      <span className="flap__half flap__half--bottom">
        <span className="flap__digits">{shown}</span>
      </span>
      {flipping && (
        <>
          <span
            key={`t${value}`}
            className="flap__half flap__half--top flap__fall"
          >
            <span className="flap__digits">{shown}</span>
          </span>
          <span
            key={`b${value}`}
            className="flap__half flap__half--bottom flap__rise"
          >
            <span className="flap__digits">{value}</span>
          </span>
        </>
      )}
    </span>
  );
}

const DATE = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** Relógio de flip na hora de quem visita. Ele decide o período do dia do Kess e da praia. */
function FlipClock() {
  const now = useNow();
  const hh = now ? String(now.getHours()).padStart(2, '0') : '--';
  const mm = now ? String(now.getMinutes()).padStart(2, '0') : '--';
  const period = now ? periodOf(now) : null;

  return (
    <div className="flip">
      <div
        className="flip__box"
        role="img"
        aria-label={now ? `Agora são ${hh}:${mm}` : 'Relógio'}
      >
        <span className="flip__window" aria-hidden="true">
          <Flap value={hh} />
          <Flap value={mm} />
        </span>
      </div>
      <div className="flip__caption">
        <p className="flip__greeting">{period ? cap(greetings[period]) : ' '}</p>
        <p className="flip__date">{now ? cap(DATE.format(now)) : ' '}</p>
      </div>
    </div>
  );
}

export default FlipClock;
