import { useCallback, useEffect, useRef, useState } from 'react';
import Kess, { type KessMood } from './Kess';

// O Kess é renderizado sempre neste tamanho; tamanhos menores são escala (fica nítido e não
// redimensiona o canvas a cada quadro do pulo).
const BASE = 120;
const IDLE_MS = 30_000;
const POKE_MS = 2_500;
// Quanto da altura do Kess fica acima da borda do card (o resto é a sombra no "chão").
const SIT = 0.86;
// Mola que prende o Kess ao lugar: com a rolagem ele atrasa um pouco e assenta com um quique.
const STIFFNESS = 380;
const DAMPING = 24;

type Target = {
  el: Element | null;
  x: number;
  y: number;
  size: number;
  mood: KessMood;
};

type Travel = {
  fromX: number;
  fromY: number;
  fromSize: number;
  start: number;
  duration: number;
  height: number;
  direction: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const perchSize = () => (window.innerWidth < 640 ? 40 : 46);

/**
 * Escolhe onde o Kess deve estar agora:
 * 1. um KessSpot visível (o lugar dele no topo da página);
 * 2. senão, a borda de cima do card mais perto da linha de leitura;
 * 3. senão, o canto de baixo da tela.
 */
function pickTarget(current: Element | null, currentX: number): Target {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  for (const el of document.querySelectorAll<HTMLElement>('[data-kess-spot]')) {
    const r = el.getBoundingClientRect();
    const center = r.top + r.height / 2;
    if (r.width > 0 && center > 0 && center < vh) {
      return {
        el,
        x: r.left,
        y: r.top,
        size: r.width,
        mood: (el.dataset.kessSpot || 'normal') as KessMood,
      };
    }
  }

  const size = perchSize();
  const line = vh * 0.3;
  let best: Target | null = null;
  let bestScore = Infinity;
  let kept: Target | null = null;
  let keptScore = Infinity;

  for (const el of document.querySelectorAll<HTMLElement>(
    '[data-kess-perch]'
  )) {
    const r = el.getBoundingClientRect();
    if (r.width < size * 3 || r.top < size + 8 || r.top > vh - 24) continue;

    const x = clamp(r.right - size - 20, 8, vw - size - 8);
    // perto da linha de leitura e, no empate, perto de onde ele já está
    const score = Math.abs(r.top - line) + Math.abs(x - currentX) * 0.15;
    const target: Target = {
      el,
      x,
      y: r.top - size * SIT,
      size,
      mood: (el.dataset.kessPerch || 'normal') as KessMood,
    };
    if (score < bestScore) {
      best = target;
      bestScore = score;
    }
    if (el === current) {
      kept = target;
      keptScore = score;
    }
  }

  // Só troca de card se o novo for bem melhor: evita pular para lá e para cá.
  if (kept && keptScore <= bestScore + 140) return kept;
  if (best) return best;

  return {
    el: null,
    x: vw - size - 16,
    y: vh - size - 10,
    size,
    mood: 'curioso',
  };
}

/**
 * Um único Kess para o site todo. Ele acompanha a rolagem pulando de um lugar para outro:
 * o KessSpot da página, a borda dos cards e o rodapé. Também reage ao visitante:
 * - passar o mouse (ou o foco) num elemento com data-kess-mood="..." muda a expressão;
 * - clique: fica feliz (e apaixonado no segundo clique);
 * - 30 s sem mexer: dorme; acorda no primeiro movimento.
 */
function KessCompanion() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [baseMood, setBaseMood] = useState<KessMood>('normal');
  const [traveling, setTraveling] = useState(false);
  const [hoverMood, setHoverMood] = useState<KessMood | null>(null);
  const [pokeMood, setPokeMood] = useState<KessMood | null>(null);
  const [sleeping, setSleeping] = useState(false);
  const pokeTimer = useRef<number>(undefined);

  // posição, pulo e mola
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const state = {
      ready: false,
      key: null as Element | null,
      x: 0,
      y: 0,
      size: 0,
      vx: 0,
      vy: 0,
      travel: null as Travel | null,
    };
    let raf = 0;
    let last = 0;
    let quietSince = 0;

    function render(rotate: number, stretch: number) {
      const k = state.size / BASE;
      const offset = (BASE / 2) * (1 - k);
      wrap!.style.transform =
        `translate3d(${state.x - offset}px, ${state.y - offset}px, 0) ` +
        `rotate(${rotate}deg) scale(${k / Math.sqrt(stretch)}, ${k * stretch})`;
    }

    function frame(now: number) {
      raf = 0;
      const dt = Math.min((now - (last || now)) / 1000, 1 / 30);
      last = now;
      const target = pickTarget(state.key, state.x);

      if (!state.ready) {
        Object.assign(state, { ready: true, key: target.el });
        Object.assign(state, { x: target.x, y: target.y, size: target.size });
        setBaseMood(target.mood);
        wrap!.style.opacity = '1';
      } else if (target.el !== state.key) {
        state.key = target.el;
        setBaseMood(target.mood);
        if (reduce) {
          Object.assign(state, { x: target.x, y: target.y, size: target.size });
        } else {
          const dx = target.x - state.x;
          const distance = Math.hypot(dx, target.y - state.y);
          state.travel = {
            fromX: state.x,
            fromY: state.y,
            fromSize: state.size,
            start: now,
            duration: clamp(420 + distance * 0.45, 480, 950),
            height: clamp(distance * 0.3, 36, 150),
            direction: Math.sign(dx) * Math.min(1, Math.abs(dx) / 260),
          };
          setTraveling(true);
        }
      }

      let rotate = 0;
      let stretch = 1;
      let busy = false;

      if (state.travel) {
        // pulo em arco; o destino é medido a cada quadro, então ele acerta o card mesmo rolando
        const t = state.travel;
        const p = Math.min((now - t.start) / t.duration, 1);
        const e = easeInOut(p);
        const arc = 4 * p * (1 - p);
        state.x = lerp(t.fromX, target.x, e);
        state.y = lerp(t.fromY, target.y, e) - t.height * arc;
        state.size = lerp(t.fromSize, target.size, e);
        rotate = t.direction * 12 * Math.sin(Math.PI * p);
        stretch = 1 + 0.08 * Math.sin(Math.PI * p);
        busy = true;
        if (p >= 1) {
          state.travel = null;
          state.vx = 0;
          state.vy = 0;
          setTraveling(false);
        }
      } else if (reduce) {
        Object.assign(state, { x: target.x, y: target.y, size: target.size });
      } else {
        state.vx +=
          (STIFFNESS * (target.x - state.x) - DAMPING * state.vx) * dt;
        state.vy +=
          (STIFFNESS * (target.y - state.y) - DAMPING * state.vy) * dt;
        state.x += state.vx * dt;
        state.y += state.vy * dt;
        state.size = lerp(state.size, target.size, 1 - Math.pow(0.001, dt));
        // estica um pouco na direção em que está sendo puxado
        stretch = 1 + clamp(Math.abs(state.vy) / 6000, 0, 0.06);
        rotate = clamp(state.vx / 60, -6, 6);
        busy =
          Math.abs(state.vx) + Math.abs(state.vy) > 1 ||
          Math.abs(target.x - state.x) + Math.abs(target.y - state.y) > 0.5 ||
          Math.abs(target.size - state.size) > 0.2;
      }

      render(rotate, stretch);

      // Parado e sem nada mudando: o laço dorme até a próxima rolagem/mudança.
      if (busy) quietSince = now;
      if (now - quietSince < 300) raf = requestAnimationFrame(frame);
      else last = 0;
    }

    function wake() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    // Mudanças de layout acordam o laço: troca de rota e classes (MutationObserver) e qualquer coisa
    // que mude a altura da página, como um card abrindo (ResizeObserver). Animações só de `style`,
    // como a barrinha de progresso infinita dos certificados, não acordam o Kess à toa.
    const mutations = new MutationObserver((records) => {
      if (records.some((record) => !wrap.contains(record.target))) wake();
    });
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    const resize = new ResizeObserver(wake);
    resize.observe(document.body);
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    wake();

    return () => {
      cancelAnimationFrame(raf);
      mutations.disconnect();
      resize.disconnect();
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
    };
  }, []);

  // expressões vindas de elementos marcados com data-kess-mood
  useEffect(() => {
    function moodFrom(target: EventTarget | null) {
      const el =
        target instanceof Element
          ? target.closest<HTMLElement>('[data-kess-mood]')
          : null;
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
    const events = [
      'pointermove',
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
    ] as const;
    events.forEach((ev) =>
      window.addEventListener(ev, wake, { passive: true })
    );
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

  const mood: KessMood =
    pokeMood ??
    hoverMood ??
    (traveling ? 'animado' : sleeping ? 'sono' : baseMood);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed top-0 left-0 z-40 opacity-0 transition-opacity duration-500 will-change-transform"
      style={{ width: BASE, height: BASE }}
    >
      <Kess
        mood={mood}
        size={BASE}
        followAccent
        onPoke={handlePoke}
        className="pointer-events-auto"
        label="Kess, mascote do Kessleru. Clique para ele pular."
      />
    </div>
  );
}

export default KessCompanion;
