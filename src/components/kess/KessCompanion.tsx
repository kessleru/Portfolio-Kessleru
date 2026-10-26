import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import type { KessMascotElement } from '@/lib/kess/kess';
import Kess, { type KessMood } from './Kess';
import { getKessEnabled, subscribeKess } from './kessPreference';

// O Kess é renderizado neste tamanho e reduzido com scale: fica nítido e o canvas não muda a cada quadro.
const BASE = 120;
// Altura dos "pés" dentro da caixa do Kess (fração a partir do topo).
const FOOT = 0.86;
// Gravidade em px/s². É ela que tira a sensação de voo: sobe desacelerando e cai acelerando.
const GRAVITY = 2600;
const IDLE_MS = 30_000;
// Enquanto a pessoa rola, o Kess fica no lugar dele (e sai da tela junto com o conteúdo);
// só escolhe outro lugar quando a rolagem para por este tempo. Sem isso, subindo e descendo
// rápido ele passaria o tempo todo no ar, perseguindo a página.
const SETTLE_MS = 220;
const POKE_MS = 2_500;

type Ground = {
  el: Element;
  kind: 'spot' | 'perch';
  /** Faixa onde ele pode ficar em pé, em coordenadas da página. */
  left: number;
  right: number;
  /** Altura dos pés, em coordenadas da página. */
  feet: number;
  size: number;
  mood: KessMood;
};

type Flight = {
  x0: number;
  y0: number;
  vx: number;
  vy0: number;
  start: number;
  duration: number;
  from: Ground | null;
  to: Ground;
  toX: number;
  fromSize: number;
  step: boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const perchSize = () => (window.innerWidth < 640 ? 40 : 46);

function measure(el: Element): Ground | null {
  if (!el.isConnected) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0) return null;
  const sx = window.scrollX;
  const sy = window.scrollY;

  if (el instanceof HTMLElement && el.dataset.kessSpot !== undefined) {
    const center = r.left + sx + r.width / 2;
    return {
      el,
      kind: 'spot',
      left: center,
      right: center,
      feet: r.top + sy + r.width * FOOT,
      size: r.width,
      mood: (el.dataset.kessSpot || 'normal') as KessMood,
    };
  }

  const size = perchSize();
  if (r.width < size * 3) return null;
  return {
    el,
    kind: 'perch',
    left: r.left + sx + size,
    right: r.right + sx - size * 0.6 - 10,
    feet: r.top + sy + 1,
    size,
    mood: ((el as HTMLElement).dataset.kessPerch || 'normal') as KessMood,
  };
}

/** O lugar do Kess no topo da página, se estiver na tela. */
function visibleSpot() {
  const vh = window.innerHeight;
  for (const el of document.querySelectorAll('[data-kess-spot]')) {
    const r = el.getBoundingClientRect();
    const center = r.top + r.height / 2;
    if (r.width > 0 && center > 0 && center < vh) return measure(el);
  }
  return null;
}

/** A borda de card mais perto da linha de leitura, com espaço para o Kess caber inteiro. */
function bestPerch(nearX: number) {
  const vh = window.innerHeight;
  const size = perchSize();
  const line = vh * 0.38;
  let best: Ground | null = null;
  let bestScore = Infinity;

  for (const el of document.querySelectorAll('[data-kess-perch]')) {
    const r = el.getBoundingClientRect();
    if (r.top < size * 1.4 || r.top > vh - 28) continue;
    const ground = measure(el);
    if (!ground) continue;
    const x = clamp(nearX, ground.left, ground.right);
    const score = Math.abs(r.top - line) + Math.abs(x - nearX) * 0.08;
    if (score < bestScore) {
      best = ground;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Um Kess só para o site todo, que mora na página como um bichinho de plataforma:
 * fica em pé no lugar dele no topo (KessSpot), na borda de cima dos cards e no rodapé,
 * e se move com gravidade, pulando de um lugar para outro conforme a leitura avança.
 * Parado, passeia, olha em volta e dorme. Quando não há onde pousar, espia da borda da tela.
 */
function KessCompanion() {
  const enabled = useSyncExternalStore(
    subscribeKess,
    getKessEnabled,
    () => true
  );
  // Na pré-renderização (build) não há document: o Kess só existe no navegador.
  const [layer] = useState(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.className = 'kess-layer';
    return el;
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const [baseMood, setBaseMood] = useState<KessMood>('normal');
  const [hoverMood, setHoverMood] = useState<KessMood | null>(null);
  const [pokeMood, setPokeMood] = useState<KessMood | null>(null);
  const [sleeping, setSleeping] = useState(false);
  const sleepingRef = useRef(false);
  const pokeTimer = useRef<number>(undefined);

  useEffect(() => {
    if (!enabled || !layer) return;
    document.body.appendChild(layer);
    return () => layer.remove();
  }, [enabled, layer]);

  useEffect(() => {
    sleepingRef.current = sleeping;
  }, [sleeping]);

  // posição, pulos e comportamento
  useEffect(() => {
    if (!enabled || !layer) return;
    const host = layer;
    const wrap = wrapRef.current;
    const shadow = shadowRef.current;
    if (!wrap || !shadow) return;

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const kess = () => wrap.querySelector<KessMascotElement>('kess-mascot');

    const s = {
      ready: false,
      mode: 'sit' as 'sit' | 'prep' | 'air' | 'peek',
      x: 0,
      y: 0,
      size: perchSize(),
      rot: 0,
      ground: null as Ground | null,
      flight: null as Flight | null,
      launchAt: 0,
      launch: null as null | (() => void),
      peekSince: 0,
      wanderTo: null as number | null,
      nextIdle: performance.now() + 6000,
      dirty: true,
      lastEval: 0,
      lastScrollY: window.scrollY,
      scrolledAt: 0,
    };
    let settleTimer = 0;
    let raf = 0;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    let gazeUntil = 0;
    function look(x: number, y: number, ms: number) {
      const el = kess();
      if (!el) return;
      el.gaze = { x, y };
      gazeUntil = performance.now() + ms;
      later(() => {
        if (performance.now() >= gazeUntil && s.mode === 'sit') el.gaze = null;
      }, ms + 10);
    }

    // O canvas é desenhado no tamanho em que o Kess aparece, não no tamanho base: bem menos pixels por quadro.
    let pixels = 0;
    function fitResolution(size: number) {
      const el = kess();
      const wanted = Math.round(size * (window.devicePixelRatio || 1) * 1.6);
      if (el && Math.abs(wanted - pixels) > pixels * 0.1) {
        pixels = wanted;
        el.setAttribute('pixels', String(wanted));
      }
    }

    function render() {
      const k = s.size / BASE;
      wrap!.style.transform = `translate3d(${s.x - BASE / 2}px, ${s.y - BASE * FOOT}px, 0) rotate(${s.rot}deg) scale(${k})`;
      if (wrap!.dataset.mode !== s.mode) wrap!.dataset.mode = s.mode;

      // A sombra fica no chão, não grudada no Kess: some quando ele sobe e reaparece no pouso.
      const f = s.flight;
      const groundY = f
        ? f.vy0 + GRAVITY * ((performance.now() - f.start) / 1000) < 0 && f.from
          ? f.from.feet
          : f.to.feet
        : s.ground?.feet;
      if (groundY === undefined || s.mode === 'peek') {
        shadow!.style.opacity = '0';
        return;
      }
      const lift = Math.max(0, groundY - s.y);
      const fade = clamp(1 - lift / 160, 0, 1);
      const w = s.size * 0.9 * (0.55 + 0.45 * fade);
      shadow!.style.opacity = String(0.55 * fade);
      shadow!.style.transform = `translate3d(${s.x - w / 2}px, ${groundY - s.size * 0.09}px, 0)`;
      shadow!.style.width = `${w}px`;
      shadow!.style.height = `${s.size * 0.18}px`;
    }

    function setGround(ground: Ground) {
      s.ground = ground;
      setBaseMood(ground.mood);
    }

    function place(ground: Ground, x: number) {
      s.x = x;
      s.y = ground.feet;
      s.size = ground.size;
      s.rot = 0;
      setGround(ground);
      fitResolution(ground.size);
    }

    function dust(x: number, y: number, power: number) {
      for (const dir of [-1, 1]) {
        const puff = document.createElement('span');
        puff.className = 'kess-dust';
        const d = s.size * 0.16;
        puff.style.width = puff.style.height = `${d}px`;
        puff.style.left = `${x - d / 2}px`;
        puff.style.top = `${y - d}px`;
        host.appendChild(puff);
        puff
          .animate(
            [
              { transform: 'translate(0, 0) scale(0.5)', opacity: 0.55 },
              {
                transform: `translate(${dir * s.size * (0.35 + power * 0.25)}px, ${-s.size * 0.12}px) scale(1.2)`,
                opacity: 0,
              },
            ],
            { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
          )
          .finished.then(
            () => puff.remove(),
            () => puff.remove()
          );
      }
    }

    // O card cede um pouquinho com o peso do pouso.
    function press(el: Element, power: number) {
      (el as HTMLElement).animate(
        [
          { transform: 'translateY(0)' },
          { transform: `translateY(${1 + power * 2}px)`, offset: 0.25 },
          { transform: 'translateY(0)' },
        ],
        { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    }

    function startFlight(to: Ground, toX: number, small: boolean, now: number) {
      let x0 = s.x;
      let y0 = s.y;
      const y1 = to.feet;
      const vh = window.innerHeight;
      const sy = window.scrollY;
      const above = y0 + s.size * 0.2 < sy;
      const below = y0 - s.size > sy + vh;
      let apex: number;

      if (!small && above && y1 > y0) {
        // Ele ficou para trás lá em cima: entra caindo pelo topo da tela.
        x0 = toX;
        y0 = sy - s.size * 1.2;
        apex = y0;
      } else if (!small && below && y1 < y0) {
        // Ficou para trás lá embaixo: entra pulando pela borda de baixo.
        x0 = toX;
        y0 = sy + vh + s.size * 0.3;
        apex = y1 - s.size * 0.55;
      } else {
        const dx = Math.abs(toX - x0);
        const up = y1 < y0 - 2;
        const height = small
          ? s.size * 0.2
          : s.size * (up ? 0.7 : 0.4) + Math.min(70, dx * 0.06);
        apex = Math.min(y0, y1) - height;
      }

      const vy0 = -Math.sqrt(2 * GRAVITY * Math.max(0, y0 - apex));
      const duration =
        -vy0 / GRAVITY + Math.sqrt((2 * Math.max(0, y1 - apex)) / GRAVITY);
      s.x = x0;
      s.y = y0;
      s.flight = {
        x0,
        y0,
        vx: (toX - x0) / Math.max(duration, 0.001),
        vy0,
        start: now,
        duration,
        from: s.ground,
        to,
        toX,
        fromSize: s.size,
        step: small,
      };
      s.ground = null;
      s.mode = 'air';
      fitResolution(Math.max(s.size, to.size));
      const el = kess();
      if (el) el.crouch = 0;
    }

    // Antecipação: olha para onde vai, agacha e só então pula.
    function jumpTo(to: Ground, toX: number, now: number, small = false) {
      const el = kess();
      const dx = toX - s.x;
      const dy = to.feet - s.y;
      const offscreen =
        s.y + s.size * 0.2 < window.scrollY ||
        s.y - s.size > window.scrollY + window.innerHeight ||
        s.mode === 'peek';

      if (reduce) {
        wrap!.style.opacity = '0';
        later(() => {
          place(to, toX);
          render();
          wrap!.style.opacity = '1';
        }, 160);
        return;
      }

      if (el) {
        el.gaze = {
          x: Math.abs(dx) < 4 ? 0 : Math.sign(dx) * 0.9,
          y: clamp(dy / 300, -0.7, 0.7),
        };
        el.crouch = small ? -0.08 : -0.22;
      }
      if (offscreen && s.mode !== 'peek') {
        startFlight(to, toX, small, now);
      } else {
        s.mode = 'prep';
        s.launchAt = now + (small ? 70 : 150);
        s.launch = () => startFlight(to, toX, small, performance.now());
      }
      wake();
    }

    function land(now: number) {
      const f = s.flight!;
      const fresh = measure(f.to.el) ?? f.to;
      const impact = f.vy0 + GRAVITY * f.duration;
      place(fresh, clamp(f.toX, fresh.left, fresh.right));
      s.flight = null;
      s.mode = 'sit';
      const el = kess();
      if (el) {
        el.crouch = 0;
        el.squash(-clamp(impact / 420, f.step ? 1 : 2, 6.5));
      }
      if (!f.step) {
        const power = clamp(impact / 1800, 0, 1);
        if (impact > 450) dust(s.x, s.y, power);
        if (impact > 800 && fresh.kind === 'perch') press(fresh.el, power);
        later(() => {
          if (s.mode === 'sit' && el) el.gaze = null;
        }, 380);
      }
      // passeando: emenda o próximo passinho
      if (s.wanderTo !== null && Math.abs(s.wanderTo - s.x) > 3) {
        later(() => walkStep(performance.now()), 40);
      } else {
        s.wanderTo = null;
        if (f.step && el)
          later(() => s.mode === 'sit' && (el.gaze = null), 300);
      }
      s.nextIdle = now + 4000 + Math.random() * 5000;
      s.dirty = true;
    }

    function walkStep(now: number) {
      if (s.mode !== 'sit' || !s.ground || s.wanderTo === null) return;
      const dx = s.wanderTo - s.x;
      if (Math.abs(dx) <= 3) {
        s.wanderTo = null;
        return;
      }
      const stride = Math.sign(dx) * Math.min(Math.abs(dx), s.size * 0.75);
      jumpTo(s.ground, s.x + stride, now, true);
    }

    function idle(now: number) {
      if (reduce || sleepingRef.current || s.mode !== 'sit' || !s.ground)
        return;
      s.nextIdle = now + 5000 + Math.random() * 6000;
      const el = kess();
      if (!el) return;
      const roll = Math.random();
      const g = s.ground;

      if (roll < 0.4 && g.kind === 'perch' && g.right - g.left > s.size * 2) {
        // passeia pela borda do card
        let target = g.left + Math.random() * (g.right - g.left);
        if (Math.abs(target - s.x) < s.size * 1.2)
          target = s.x > (g.left + g.right) / 2 ? g.left + s.size : g.right;
        s.wanderTo = clamp(target, g.left, g.right);
        walkStep(now);
      } else if (roll < 0.65) {
        // olha em volta
        look(-0.9, -0.1, 700);
        later(() => s.mode === 'sit' && look(0.9, -0.1, 700), 750);
      } else if (roll < 0.8) {
        // espia o conteúdo do card
        look(0, 0.8, 1200);
      } else {
        el.hop(2.6);
      }
    }

    function peekPosition() {
      s.size = perchSize();
      const rise = clamp((performance.now() - s.peekSince) / 450, 0, 1);
      const ease = 1 - Math.pow(1 - rise, 3);
      s.x = window.scrollX + window.innerWidth - s.size * 0.75;
      // sobe só até os olhos passarem da borda da tela
      s.y =
        window.scrollY +
        window.innerHeight +
        s.size * (0.2 + (1 - ease) * 0.75);
      s.rot = -8 * ease;
    }

    function evaluate(now: number) {
      s.dirty = false;
      s.lastEval = now;
      if (s.mode === 'air' || s.mode === 'prep') return;
      if (s.ready && now - s.scrolledAt < SETTLE_MS) return;

      const spot = visibleSpot();
      if (spot) {
        if (s.ground?.el !== spot.el) {
          if (!s.ready) place(spot, spot.left);
          else jumpTo(spot, spot.left, now);
        } else if (
          Math.abs(spot.feet - s.y) > 1 ||
          Math.abs(spot.left - s.x) > 1
        ) {
          place(spot, spot.left);
        }
        return;
      }

      // Continua onde está enquanto ele mesmo estiver na tela: só pula quando precisa.
      const sy = window.scrollY;
      const vh = window.innerHeight;
      if (s.mode === 'sit' && s.ground) {
        const fresh = measure(s.ground.el);
        const visible =
          fresh &&
          fresh.feet - s.size * 0.95 > sy + 4 &&
          fresh.feet < sy + vh - 8;
        if (fresh && visible) {
          if (fresh.feet > s.y + 8) {
            // o card desceu (algo abriu acima dele): cai junto
            jumpTo(fresh, clamp(s.x, fresh.left, fresh.right), now, true);
          } else {
            s.y = fresh.feet;
            s.ground = fresh;
            s.x = clamp(s.x, fresh.left, fresh.right);
          }
          return;
        }
      }

      const perch = bestPerch(s.x);
      if (perch) {
        const toX =
          s.x >= perch.left && s.x <= perch.right && s.mode !== 'peek'
            ? s.x
            : perch.right;
        if (!s.ready) place(perch, toX);
        else jumpTo(perch, toX, now);
        return;
      }

      if (s.mode !== 'peek') {
        s.mode = 'peek';
        s.ground = null;
        s.wanderTo = null;
        s.peekSince = now;
        setBaseMood('curioso');
        const el = kess();
        if (el) el.gaze = { x: -0.7, y: -0.6 };
      }
    }

    function frame(now: number) {
      raf = 0;
      if (s.dirty || now - s.lastEval > 500) evaluate(now);

      if (s.mode === 'prep' && now >= s.launchAt && s.launch) {
        const launch = s.launch;
        s.launch = null;
        launch();
      }

      if (s.mode === 'air' && s.flight) {
        const f = s.flight;
        const t = (now - f.start) / 1000;
        if (t >= f.duration) {
          land(now);
        } else {
          const vy = f.vy0 + GRAVITY * t;
          s.x = f.x0 + f.vx * t;
          s.y = f.y0 + f.vy0 * t + 0.5 * GRAVITY * t * t;
          s.size = f.fromSize + (f.to.size - f.fromSize) * (t / f.duration);
          // estica quando está rápido, solta no topo do pulo e se inclina para onde vai
          const el = kess();
          if (el)
            el.crouch = f.step ? 0.04 : clamp(Math.abs(vy) / 3800, 0, 0.16);
          s.rot = f.step ? 0 : clamp(f.vx / 110, -7, 7);
        }
      } else if (s.mode === 'peek') {
        peekPosition();
      }

      if (s.mode === 'sit' && now >= s.nextIdle) idle(now);

      if (!s.ready) {
        s.ready = true;
        wrap!.style.opacity = '1';
      }
      render();
      if (s.mode !== 'sit' || s.dirty) raf = requestAnimationFrame(frame);
    }

    function wake() {
      s.dirty = true;
      if (!raf) raf = requestAnimationFrame(frame);
    }

    // Rolando: ele acompanha o movimento com o olhar.
    function onScroll() {
      const dy = window.scrollY - s.lastScrollY;
      s.lastScrollY = window.scrollY;
      s.scrolledAt = performance.now();
      if (s.mode === 'sit' && Math.abs(dy) > 2 && !reduce) {
        look(0, dy > 0 ? 0.6 : -0.6, 450);
      }
      // reavalia quando a rolagem acalmar
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(wake, SETTLE_MS + 20);
      if (s.mode === 'peek') wake();
    }

    const idleTimer = window.setInterval(() => {
      if (s.mode === 'sit' && performance.now() >= s.nextIdle) wake();
    }, 1000);
    const mutations = new MutationObserver((records) => {
      if (records.some((record) => !host.contains(record.target))) wake();
    });
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    const resize = new ResizeObserver(wake);
    resize.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', wake);
    wake();

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(idleTimer);
      window.clearTimeout(settleTimer);
      timers.forEach((id) => window.clearTimeout(id));
      mutations.disconnect();
      resize.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', wake);
    };
  }, [enabled, layer]);

  // expressões vindas de elementos marcados com data-kess-mood
  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

  // dorme quando a página fica parada
  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

  useEffect(() => () => window.clearTimeout(pokeTimer.current), []);

  const handlePoke = useCallback(() => {
    setPokeMood((prev) => (prev === 'feliz' ? 'apaixonado' : 'feliz'));
    window.clearTimeout(pokeTimer.current);
    pokeTimer.current = window.setTimeout(() => setPokeMood(null), POKE_MS);
  }, []);

  if (!enabled || !layer) return null;

  const mood: KessMood =
    pokeMood ?? hoverMood ?? (sleeping ? 'sono' : baseMood);

  return createPortal(
    <>
      <div ref={shadowRef} aria-hidden="true" className="kess-shadow" />
      <div
        ref={wrapRef}
        className="kess-body"
        style={{
          width: BASE,
          height: BASE,
          transformOrigin: `50% ${FOOT * 100}%`,
        }}
      >
        <Kess
          mood={mood}
          size={BASE}
          grounded
          followAccent
          onPoke={handlePoke}
          className="pointer-events-auto"
          label="Kess, mascote do Kessleru. Clique para ele pular."
        />
      </div>
    </>,
    layer
  );
}

export default KessCompanion;
