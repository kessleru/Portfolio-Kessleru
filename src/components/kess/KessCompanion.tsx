import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import type { KessMascotElement } from '@/lib/kess/kess';
import Kess, { type KessMood } from './Kess';
import { createBubble, hideBubble, spawnEmote, type Emote } from './kessEmotes';
import { greeting, lines, pageLines, pick } from './kessLines';
import {
  KESS_EVENT,
  kessFitsScreen,
  subscribeScreen,
  type KessEventDetail,
} from './kessPreference';

// O Kess é renderizado neste tamanho e reduzido com scale: fica nítido e o canvas não muda a cada quadro.
const BASE = 120;
// Altura dos "pés" dentro da caixa do Kess (fração a partir do topo).
const FOOT = 0.86;
// Gravidade em px/s². É ela que tira a sensação de voo: sobe desacelerando e cai acelerando.
// fantasma: gravidade baixa, os pulos viram voos curtos e lentos
const GRAVITY = 1500;
const IDLE_MS = 30_000;
const YAWN_MS = 1_600;
// Enquanto a pessoa rola, o Kess fica no lugar dele (e sai da tela junto com o conteúdo);
// só escolhe outro lugar quando a rolagem para por este tempo. Sem isso, subindo e descendo
// rápido ele passaria o tempo todo no ar, perseguindo a página.
const SETTLE_MS = 220;
// Fala sozinho (sem ninguém mexer nele) no máximo uma vez a cada 45 s.
const IDLE_LINE_MS = 45_000;
const HELLO_KEY = 'kess-oi';
const PERCH = 46;

// Emote que sai quando a emoção começa…
const MOOD_EMOTE: Partial<Record<KessMood, Emote>> = {
  surpreso: 'bang',
  confuso: 'question',
  curioso: 'question',
  inspiracao: 'sparkle',
  animado: 'sparkle',
  bravo: 'anger',
  feliz: 'note',
  triste: 'sweat',
  apaixonado: 'heart',
  timido: 'heart',
};
// …e os que se repetem enquanto ela dura.
const MOOD_LOOP: Partial<Record<KessMood, [Emote, number]>> = {
  sono: ['z', 1400],
  apaixonado: ['heart', 1100],
  timido: ['heart', 1500],
  tonto: ['star', 420],
  triste: ['sweat', 4200],
};

type Actions = {
  emote(kind: Emote): void;
  say(text: string): void;
  wave(): void;
  hop(power?: number): void;
  arrive(): void;
};

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

  const size = PERCH;
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
  const size = PERCH;
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

/** Outra borda de card na tela, de preferência longe para o lado (outra coluna), para ele trocar de lugar. */
function otherPerch(current: Ground) {
  const vh = window.innerHeight;
  const size = PERCH;
  const here = (current.left + current.right) / 2;
  const options: { ground: Ground; weight: number }[] = [];
  for (const el of document.querySelectorAll('[data-kess-perch]')) {
    if (el === current.el) continue;
    const r = el.getBoundingClientRect();
    if (r.top < size * 1.4 || r.top > vh - 28) continue;
    const ground = measure(el);
    if (!ground || ground.kind !== 'perch') continue;
    const dx = Math.abs((ground.left + ground.right) / 2 - here);
    const dy = Math.abs(ground.feet - current.feet);
    if (dx < size * 2 && dy < size) continue;
    // mais chance para quem está do lado (outra coluna) e não muito acima ou abaixo
    options.push({ ground, weight: 1 + dx / 200 - Math.min(0.8, dy / 600) });
  }
  if (!options.length) return null;
  let roll = Math.random() * options.reduce((t, o) => t + o.weight, 0);
  for (const o of options) if ((roll -= o.weight) <= 0) return o.ground;
  return options[options.length - 1].ground;
}

/**
 * Um Kess só para o site todo, que mora na página como um bichinho de plataforma:
 * fica em pé no lugar dele no topo (KessSpot), na borda de cima dos cards e no rodapé,
 * e se move com gravidade, pulando de um lugar para outro conforme a leitura avança.
 * Parado, passeia aos pulinhos, olha em volta, cantarola, fala uma coisinha de vez em quando e dorme.
 * Reage a clique (e a muitos cliques), carinho com o mouse, troca de tema, texto copiado,
 * volta para a aba e a quem digitar "kess". Quando não há onde pousar, espia da borda da tela.
 */
function KessCompanion() {
  const fits = useSyncExternalStore(
    subscribeScreen,
    kessFitsScreen,
    () => false
  );
  const enabled = fits;
  const { pathname } = useLocation();
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
  const [flashMood, setFlashMood] = useState<KessMood | null>(null);
  const [petting, setPetting] = useState(false);
  const [sleep, setSleep] = useState<'awake' | 'yawn' | 'sleep'>('awake');
  const sleepRef = useRef(sleep);
  const flashTimer = useRef<number>(undefined);
  const actions = useRef<Actions | null>(null);
  const pokes = useRef<number[]>([]);

  // Emoção passageira (clique, troca de tema, susto…), por cima de todas as outras.
  const flash = useCallback((next: KessMood, ms: number) => {
    setFlashMood(next);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashMood(null), ms);
  }, []);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  useEffect(() => {
    if (!enabled || !layer) return;
    document.body.appendChild(layer);
    return () => layer.remove();
  }, [enabled, layer]);

  useEffect(() => {
    sleepRef.current = sleep;
  }, [sleep]);

  // posição, pulos, caminhada e comportamento
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
      size: PERCH,
      rot: 0,
      ground: null as Ground | null,
      flight: null as Flight | null,
      launchAt: 0,
      launch: null as null | (() => void),
      peekSince: 0,
      // pulos à toa (passear, trocar de card) têm intervalo mínimo: pular toda hora fica estranho
      lastIdleJump: 0,
      lastCardJump: 0,
      hopTo: null as number | null,
      nextIdle: performance.now() + 6000,
      dirty: true,
      lastEval: 0,
      lastScrollY: window.scrollY,
      scrolledAt: 0,
      bubble: null as null | { el: HTMLElement; timer: number },
      lastSay: 0,
      saidFooter: false,
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

      // O balão acompanha a cabeça; vai para a esquerda quando não cabe à direita.
      if (s.bubble) {
        const el = s.bubble.el;
        const right = s.x < window.scrollX + window.innerWidth - 260;
        const side = right ? 'right' : 'left';
        if (el.dataset.side !== side) el.dataset.side = side;
        const x = s.x + (right ? 1 : -1) * s.size * 0.18;
        el.style.transform = `translate3d(${x}px, ${s.y - s.size * 0.72}px, 0) translate(${right ? '0' : '-100%'}, -100%)`;
      }

      // A sombra fica no chão, não grudada no Kess: some logo que ele sobe e reaparece no pouso.
      // Sem Kess à vista (escondido, chegando na página, espiando) não tem sombra.
      const f = s.flight;
      const g = f
        ? f.vy0 + GRAVITY * ((performance.now() - f.start) / 1000) < 0 && f.from
          ? f.from
          : f.to
        : s.ground;
      if (!g || s.mode === 'peek' || wrap!.style.opacity === '0') {
        shadow!.style.opacity = '0';
        return;
      }
      const groundY = g.feet;
      const lift = Math.max(0, groundY - s.y);
      const fade = clamp(1 - lift / 70, 0, 1);
      // a sombra fica toda abaixo das perninhas (a barra é aberta: alta demais, ela aparece entre elas)
      // em cima de um card, a sombra não passa da borda dele
      let half = (s.size * 0.8 * (0.6 + 0.4 * fade)) / 2;
      if (g.kind === 'perch') {
        const edge = s.size * 0.3;
        half = Math.min(half, s.x - (g.left - edge), g.right + edge - s.x);
      }
      if (fade <= 0 || half < s.size * 0.12) {
        shadow!.style.opacity = '0';
        return;
      }
      shadow!.style.opacity = String(0.3 * fade);
      shadow!.style.transform = `translate3d(${s.x - half}px, ${groundY - s.size * 0.012}px, 0)`;
      shadow!.style.width = `${half * 2}px`;
      shadow!.style.height = `${s.size * 0.08}px`;
    }

    // ---------- falas e emotes ----------
    function say(text: string) {
      s.lastSay = performance.now();
      if (s.bubble) {
        window.clearTimeout(s.bubble.timer);
        hideBubble(s.bubble.el);
      }
      const el = createBubble(host, text, reduce);
      const timer = window.setTimeout(
        () => {
          if (s.bubble?.el !== el) return;
          hideBubble(el);
          s.bubble = null;
        },
        2200 + text.length * 45
      );
      s.bubble = { el, timer };
      render();
    }

    const lastEmote = new Map<Emote, number>();
    function emote(kind: Emote) {
      const now = performance.now();
      if (now - (lastEmote.get(kind) ?? 0) < 350) return;
      lastEmote.set(kind, now);
      spawnEmote(
        host,
        kind,
        s.x + s.size * 0.28,
        s.y - s.size * 0.7,
        s.size,
        reduce
      );
    }

    // Trocou de página: o chão antigo sumiu junto com a página (e a formação ainda pode estar
    // carregando). Ele some, espera o lugar dele na página nova aparecer e cai lá de cima.
    let arriveUntil = 0;
    function arrive() {
      s.flight = null;
      s.launch = null;
      s.hopTo = null;
      s.ground = null;
      s.mode = 'sit';
      arriveUntil = performance.now() + 1500;
      wrap!.style.opacity = '0';
      if (s.bubble) {
        window.clearTimeout(s.bubble.timer);
        hideBubble(s.bubble.el);
        s.bubble = null;
      }
      wake();
    }

    actions.current = {
      emote,
      say,
      wave: () => kess()?.wave(),
      hop: (power) => kess()?.hop(power),
      arrive,
    };

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

    // ---------- passeio: pulinhos seguidos pela borda do card ----------
    function hopStep(now: number) {
      if (s.mode !== 'sit' || !s.ground || s.hopTo === null) return;
      const dx = s.hopTo - s.x;
      if (Math.abs(dx) <= 3) {
        s.hopTo = null;
        return;
      }
      const stride = Math.sign(dx) * Math.min(Math.abs(dx), s.size * 1.05);
      jumpTo(s.ground, s.x + stride, now, true);
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
          ? s.size * 0.34
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
      if (!small) s.hopTo = null;
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
          s.mode = 'sit';
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
        el.squash(-clamp(impact / 700, f.step ? 1 : 1.2, 3));
      }
      if (!f.step) {
        const power = clamp(impact / 1800, 0, 1);
        if (impact > 1400) dust(s.x, s.y, power); // fantasma quase não levanta poeira
        if (impact > 800 && fresh.kind === 'perch') press(fresh.el, power);
        later(() => {
          if (s.mode === 'sit' && el) el.gaze = null;
        }, 380);
      } else if (s.hopTo !== null && Math.abs(s.hopTo - s.x) > 3) {
        // emenda o próximo pulinho depois de uma pausa curta, como um bichinho saltitando
        later(() => hopStep(performance.now()), 110);
      } else {
        s.hopTo = null;
        if (el) later(() => s.mode === 'sit' && (el.gaze = null), 300);
      }
      // chegou no fim da página
      if (fresh.el.tagName === 'FOOTER' && !s.saidFooter) {
        s.saidFooter = true;
        later(() => say(pick(lines.footer)), 250);
      }
      s.nextIdle = now + 4000 + Math.random() * 5000;
      s.dirty = true;
    }

    function idle(now: number) {
      if (
        reduce ||
        sleepRef.current !== 'awake' ||
        s.mode !== 'sit' ||
        !s.ground
      )
        return;
      s.nextIdle = now + 5000 + Math.random() * 6000;
      const el = kess();
      if (!el) return;
      const roll = Math.random();
      const g = s.ground;
      const canJump = now - s.lastIdleJump > 15_000;
      // de vez em quando troca de card (ex.: pula de um projeto para outro, em outra coluna)
      if (
        canJump &&
        now - s.lastCardJump > 35_000 &&
        g.kind === 'perch' &&
        !visibleSpot() &&
        Math.random() < 0.25
      ) {
        const to = otherPerch(g);
        if (to) {
          s.lastIdleJump = s.lastCardJump = now;
          const toX = to.left + Math.random() * (to.right - to.left);
          later(
            () => s.mode === 'sit' && jumpTo(to, toX, performance.now()),
            450
          );
          look(toX > s.x ? 1 : -1, to.feet < s.y ? -0.4 : 0.2, 500);
          return;
        }
      }

      if (roll < 0.14 && now - s.lastSay > IDLE_LINE_MS) {
        // fala uma coisinha
        say(pick(lines.idle));
      } else if (
        roll < 0.38 &&
        canJump &&
        g.kind === 'perch' &&
        g.right - g.left > s.size * 2
      ) {
        s.lastIdleJump = now;
        // passeia pela borda do card
        // de 2 a 5 pulinhos para um lado (o que tiver mais espaço, às vezes o outro)
        const roomRight = g.right - s.x;
        const roomLeft = s.x - g.left;
        const dir = roomRight > roomLeft === Math.random() < 0.75 ? 1 : -1;
        const distance = s.size * (1.6 + Math.random() * 3.4);
        s.hopTo = clamp(s.x + dir * distance, g.left, g.right);
        hopStep(now);
      } else if (roll < 0.58) {
        // olha em volta
        look(-0.9, -0.1, 700);
        later(() => s.mode === 'sit' && look(0.9, -0.1, 700), 750);
      } else if (roll < 0.68) {
        // espia o conteúdo do card
        look(0, 0.8, 1200);
      } else if (roll < 0.8) {
        // cantarola
        flash('feliz', 1700);
        emote('note');
        later(() => emote('note'), 600);
      } else if (roll < 0.94 || !canJump) {
        el.wave();
      } else {
        s.lastIdleJump = now;
        el.hop(2.6);
      }
    }

    function peekPosition() {
      s.size = PERCH;
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
      if (arriveUntil) {
        // espera só enquanto a página nova ainda não desenhou nada (a formação carrega à parte)
        const loading = !document.querySelector('main')?.childElementCount;
        if (!spot && loading && now < arriveUntil) {
          s.dirty = true;
          return;
        }
        arriveUntil = 0;
        wrap!.style.opacity = '1';
        const target =
          spot ?? bestPerch(window.scrollX + window.innerWidth * 0.3);
        if (target) {
          const x = target.kind === 'spot' ? target.left : target.right;
          if (reduce) {
            place(target, x);
          } else {
            s.x = x;
            s.y = target.feet - target.size * 1.6;
            s.size = target.size;
            startFlight(target, x, false, now);
          }
          return;
        }
      }

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
            if (s.hopTo !== null)
              s.hopTo = clamp(s.hopTo, fresh.left, fresh.right);
          }
          return;
        }
        s.hopTo = null;
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
            el.crouch = f.step
              ? clamp(Math.abs(vy) / 3000, 0, 0.1)
              : clamp(Math.abs(vy) / 3800, 0, 0.16);
          s.rot = clamp(
            f.vx / (f.step ? 90 : 110),
            f.step ? -5 : -7,
            f.step ? 5 : 7
          );
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

    // carinho: o mouse parado em cima dele por um instante
    let petTimer = 0;
    const petStart = () => {
      petTimer = window.setTimeout(() => setPetting(true), 450);
    };
    const petEnd = () => {
      window.clearTimeout(petTimer);
      setPetting(false);
    };
    const kessEl = kess();
    kessEl?.addEventListener('pointerenter', petStart);
    kessEl?.addEventListener('pointerleave', petEnd);

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
    // pulo dentro do próprio canvas (clique, susto): a sombra no chão encolhe e clareia junto
    const onLift = (e: Event) => {
      const lift = (e as CustomEvent<number>).detail;
      shadow.style.scale = lift ? String(1 - lift * 0.4) : '';
      shadow.style.filter = lift ? `opacity(${1 - lift * 0.8})` : '';
    };
    wrap.addEventListener('kess-lift', onLift);

    const resize = new ResizeObserver(wake);
    resize.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', wake);
    wake();

    return () => {
      actions.current = null;
      cancelAnimationFrame(raf);
      window.clearInterval(idleTimer);
      window.clearTimeout(settleTimer);
      window.clearTimeout(petTimer);
      timers.forEach((id) => window.clearTimeout(id));
      if (s.bubble) {
        window.clearTimeout(s.bubble.timer);
        s.bubble.el.remove();
      }
      wrap.removeEventListener('kess-lift', onLift);
      kessEl?.removeEventListener('pointerenter', petStart);
      kessEl?.removeEventListener('pointerleave', petEnd);
      mutations.disconnect();
      resize.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', wake);
    };
  }, [enabled, layer, flash]);

  // Navegou para outra página (não conta a primeira)
  const firstPath = useRef(true);
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    actions.current?.arrive();
  }, [pathname]);

  // Ao chegar: na primeira página da visita, cumprimenta (pela hora, dia ou data especial);
  // nas seguintes, às vezes comenta a página. No 404, sempre.
  useEffect(() => {
    if (!enabled) return;
    const id = window.setTimeout(() => {
      const a = actions.current;
      if (!a) return;
      let first = false;
      try {
        first = !sessionStorage.getItem(HELLO_KEY);
        sessionStorage.setItem(HELLO_KEY, '1');
      } catch {
        // sem sessionStorage: não cumprimenta de novo nesta página
      }
      if (first) {
        a.wave();
        a.say(greeting());
        flash('feliz', 1800);
        return;
      }
      const lost = document.querySelector('[data-kess-spot="triste"]');
      const options = lost ? pageLines['404'] : pageLines[pathname];
      if (options && (lost || Math.random() < 0.6)) a.say(pick(options));
    }, 1100);
    return () => window.clearTimeout(id);
  }, [enabled, pathname, flash]);

  // expressões vindas de elementos marcados com data-kess-mood (e falas de data-kess-say)
  useEffect(() => {
    if (!enabled) return;
    const said = new WeakSet<Element>();
    function moodFrom(target: EventTarget | null) {
      const el =
        target instanceof Element
          ? target.closest<HTMLElement>('[data-kess-mood]')
          : null;
      return (el?.dataset.kessMood as KessMood | undefined) ?? null;
    }
    const enter = (e: Event) => {
      setHoverMood(moodFrom(e.target));
      const sayEl =
        e.target instanceof Element
          ? e.target.closest<HTMLElement>('[data-kess-say]')
          : null;
      if (sayEl && !said.has(sayEl)) {
        said.add(sayEl);
        actions.current?.say(sayEl.dataset.kessSay ?? '');
      }
    };
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

  // boceja e dorme quando a página fica parada; acorda num susto
  useEffect(() => {
    if (!enabled) return;
    let timer = 0;
    const doze = () => {
      setSleep('yawn');
      timer = window.setTimeout(() => setSleep('sleep'), YAWN_MS);
    };
    timer = window.setTimeout(doze, IDLE_MS);
    const activity = () => {
      window.clearTimeout(timer);
      if (sleepRef.current === 'sleep') {
        sleepRef.current = 'awake';
        flash('surpreso', 900);
        actions.current?.hop(3);
      }
      if (sleepRef.current !== 'awake') sleepRef.current = 'awake';
      setSleep('awake');
      timer = window.setTimeout(doze, IDLE_MS);
    };
    const events = [
      'pointermove',
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
    ] as const;
    events.forEach((ev) =>
      window.addEventListener(ev, activity, { passive: true })
    );
    return () => {
      window.clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, activity));
    };
  }, [enabled, flash]);

  // troca de tema ou de cor de destaque (ele gosta: a cor dele muda junto), texto copiado,
  // volta para a aba, alguém digitando "kess" e pedidos do resto do site
  useEffect(() => {
    if (!enabled) return;
    let hiddenAt = 0;
    let typed = '';
    const html = document.documentElement;
    const readTheme = () => ({
      theme: html.dataset.theme ?? 'mocha',
      accent: html.style.getPropertyValue('--ctp-accent'),
    });
    let shown = readTheme();
    const themeWatch = new MutationObserver(() => {
      const next = readTheme();
      const prev = shown;
      shown = next;
      if (prev.theme === next.theme && prev.accent === next.accent) return;
      flash('animado', 1400);
      if (prev.theme !== next.theme) actions.current?.say(pick(lines.theme));
      else actions.current?.say(pick(lines.accent));
    });
    themeWatch.observe(html, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    });
    const onCopy = () => {
      flash('feliz', 1400);
      actions.current?.emote('sparkle');
      actions.current?.say(pick(lines.copy));
    };
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt && Date.now() - hiddenAt > 20_000) {
        flash('animado', 1600);
        actions.current?.hop(3.2);
        actions.current?.say(pick(lines.back));
      }
      hiddenAt = 0;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      )
        return;
      typed = (typed + e.key.toLowerCase()).slice(-4);
      if (typed !== 'kess') return;
      typed = '';
      flash('animado', 1600);
      actions.current?.wave();
      actions.current?.hop(3.4);
      actions.current?.say(pick(lines.called));
    };
    const onRequest = (e: Event) => {
      const detail = (e as CustomEvent<KessEventDetail>).detail;
      if (detail.mood) flash(detail.mood, detail.ms ?? 1600);
      if (detail.emote) actions.current?.emote(detail.emote);
      if (detail.say) actions.current?.say(detail.say);
    };
    document.addEventListener('copy', onCopy);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('keydown', onKey);
    window.addEventListener(KESS_EVENT, onRequest);
    return () => {
      themeWatch.disconnect();
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(KESS_EVENT, onRequest);
    };
  }, [enabled, flash]);

  // Clique: feliz; vários seguidos: apaixonado; muitos: fica tonto.
  const handlePoke = useCallback(() => {
    const now = performance.now();
    pokes.current = [...pokes.current.filter((t) => now - t < 1600), now];
    const count = pokes.current.length;
    if (count >= 6) {
      pokes.current = [];
      flash('tonto', 2600);
    } else if (count >= 3) {
      flash('apaixonado', 2200);
    } else {
      flash('feliz', 1600);
    }
  }, [flash]);

  const mood: KessMood =
    flashMood ??
    (petting ? 'timido' : null) ??
    hoverMood ??
    (sleep === 'sleep' ? 'sono' : sleep === 'yawn' ? 'bocejo' : baseMood);

  // emotes da emoção: um quando ela começa e, em algumas, outros enquanto dura
  const lastMoodEmote = useRef(new Map<Emote, number>());
  useEffect(() => {
    if (!enabled) return;
    const once = MOOD_EMOTE[mood];
    const now = performance.now();
    if (once && now - (lastMoodEmote.current.get(once) ?? 0) > 1500) {
      lastMoodEmote.current.set(once, now);
      actions.current?.emote(once);
    }
    const loop = MOOD_LOOP[mood];
    if (!loop) return;
    const id = window.setInterval(
      () => actions.current?.emote(loop[0]),
      loop[1]
    );
    return () => window.clearInterval(id);
  }, [enabled, mood]);

  if (!enabled || !layer) return null;

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
