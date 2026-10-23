import { useCallback, useEffect, useRef, useState } from 'react';
import Kess, { type KessMood, type KessSize } from './Kess';

const IDLE_MS = 30_000;
const POKE_MS = 2_500;

type KessGreeterProps = {
  size?: KessSize;
  className?: string;
};

/**
 * Kess do início: reage ao visitante.
 * - Passar o mouse (ou o foco) em qualquer elemento com data-kess-mood="..." muda a expressão.
 * - Clique: fica feliz (e apaixonado no segundo clique).
 * - 30 s sem mexer: dorme; acorda no primeiro movimento.
 */
function KessGreeter({ size = 'clamp(56px, 7vw, 76px)', className }: KessGreeterProps) {
  const [hoverMood, setHoverMood] = useState<KessMood | null>(null);
  const [pokeMood, setPokeMood] = useState<KessMood | null>(null);
  const [sleeping, setSleeping] = useState(false);
  const pokeTimer = useRef<number>(undefined);

  // expressões vindas de elementos marcados com data-kess-mood
  useEffect(() => {
    function moodFrom(target: EventTarget | null) {
      const el = target instanceof Element ? target.closest<HTMLElement>('[data-kess-mood]') : null;
      return (el?.dataset.kessMood as KessMood | undefined) ?? null;
    }
    const enter = (e: Event) => setHoverMood(moodFrom(e.target));
    const leave = (e: Event) => {
      const next = (e as PointerEvent | FocusEvent).relatedTarget;
      setHoverMood(moodFrom(next));
    };

    document.addEventListener('pointerover', enter);
    document.addEventListener('pointerout', leave);
    document.addEventListener('focusin', enter);
    document.addEventListener('focusout', leave);
    return () => {
      document.removeEventListener('pointerover', enter);
      document.removeEventListener('pointerout', leave);
      document.removeEventListener('focusin', enter);
      document.removeEventListener('focusout', leave);
    };
  }, []);

  // dorme quando a página fica parada
  useEffect(() => {
    let timer = window.setTimeout(() => setSleeping(true), IDLE_MS);
    const wake = () => {
      setSleeping(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSleeping(true), IDLE_MS);
    };
    const events = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, wake));
    };
  }, []);

  useEffect(() => () => window.clearTimeout(pokeTimer.current), []);

  const handlePoke = useCallback(() => {
    setPokeMood((prev) => (prev === 'feliz' ? 'apaixonado' : 'feliz'));
    window.clearTimeout(pokeTimer.current);
    pokeTimer.current = window.setTimeout(() => setPokeMood(null), POKE_MS);
  }, []);

  const mood: KessMood = pokeMood ?? hoverMood ?? (sleeping ? 'sono' : 'normal');

  return (
    <Kess
      mood={mood}
      size={size}
      followAccent
      onPoke={handlePoke}
      className={className}
      label="Kess, mascote do Kessleru. Clique para ele pular."
    />
  );
}

export default KessGreeter;
