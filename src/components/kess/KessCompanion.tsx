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
const IDLE_MS = 60_000;
const YAWN_MS = 1_600;
// Enquanto a pessoa rola, o Kess fica no lugar dele (e sai da tela junto com o conteúdo);
// só escolhe outro lugar quando a rolagem para por este tempo. Sem isso, subindo e descendo
// rápido ele passaria o tempo todo no ar, perseguindo a página.
const SETTLE_MS = 220;
// Passeios e pulos à toa só começam com a página parada há um tempo (nunca durante a rolagem).
const QUIET_MS = 1200;
// Fala sozinho (sem ninguém mexer nele) no máximo uma vez a cada 45 s.
const IDLE_LINE_MS = 45_000;
const HELLO_KEY = 'kess-oi';
const HINT_KEY = 'kess-dica';
const PERCH = 46;
// No colo: segurar parado por HOLD_MS começa a carregar o pulão (cheio em CHARGE_MS);
// mover DRAG_PX com o botão apertado pega ele no colo.
const HOLD_MS = 260;
const CHARGE_MS = 900;
const DRAG_PX = 6;
// A velocidade do arremesso sai dos movimentos destes últimos ms antes de soltar.
const THROW_MS = 150;
const THROW_SPEED = 1600;

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
  /** O que fazer ao pousar (some junto se o voo for interrompido). */
  onLand?: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function measure(el: Element, r = el.getBoundingClientRect()): Ground | null {
  if (!el.isConnected || r.width === 0) return null;
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

/** Bordas de card com o topo entre `top` e `bottom` (px da tela). */
function perchesOnScreen(top: number, bottom: number) {
  const found: Ground[] = [];
  for (const el of document.querySelectorAll('[data-kess-perch]')) {
    const r = el.getBoundingClientRect();
    if (r.top < top || r.top > bottom) continue;
    const ground = measure(el, r);
    if (ground?.kind === 'perch') found.push(ground);
  }
  return found;
}

// com espaço para o Kess caber inteiro acima da borda
const roomyPerches = () =>
  perchesOnScreen(PERCH * 1.4, window.innerHeight - 28);

/** A borda de card mais perto da linha de leitura. */
function bestPerch(nearX: number) {
  const line = window.scrollY + window.innerHeight * 0.38;
  let best: Ground | null = null;
  let bestScore = Infinity;
  for (const ground of roomyPerches()) {
    const x = clamp(nearX, ground.left, ground.right);
    const score = Math.abs(ground.feet - line) + Math.abs(x - nearX) * 0.08;
    if (score < bestScore) {
      best = ground;
      bestScore = score;
    }
  }
  return best;
}

/** A borda de card na tela logo abaixo de um ponto da página (onde ele foi solto). */
function perchBelow(x: number, y: number, size: number) {
  let best: Ground | null = null;
  let bestScore = Infinity;
  for (const ground of perchesOnScreen(0, window.innerHeight - 20)) {
    const dx =
      x < ground.left
        ? ground.left - x
        : x > ground.right
          ? x - ground.right
          : 0;
    const dy = ground.feet - y;
    // abaixo do ponto ganha; acima, só se não houver nada embaixo
    const score = (dy >= -size * 0.4 ? dy : 600 - dy) + dx * 2;
    if (score < bestScore) {
      best = ground;
      bestScore = score;
    }
  }
  return best;
}

/** Outra borda de card na tela, de preferência longe para o lado (outra coluna), para ele trocar de lugar. */
function otherPerch(current: Ground) {
  const size = PERCH;
  const here = (current.left + current.right) / 2;
  const options: { ground: Ground; weight: number }[] = [];
  for (const ground of roomyPerches()) {
    if (ground.el === current.el) continue;
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

// O que só acontece uma vez por visita (cumprimento, dica). Sem sessionStorage, vale até recarregar a página.
const seen = new Set<string>();
function firstInSession(key: string) {
  if (seen.has(key)) return false;
  seen.add(key);
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
  } catch {
    // sem sessionStorage: fica só a lembrança acima
  }
  return true;
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
    const body = wrap?.querySelector<KessMascotElement>('kess-mascot');
    if (!wrap || !shadow || !body) return;

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const s = {
      ready: false,
      // charge: segurado parado, carregando o pulão; drag: no colo, pendurado no cursor
      mode: 'sit' as 'sit' | 'prep' | 'air' | 'peek' | 'charge' | 'drag',
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
      // alguém levou ele para outro canto (arrastou, pulão, ↑): nesta página ele não volta sozinho
      // para o lugar do topo; fica nos cards (só volta se não houver card na tela)
      placed: false,
      // altura do pulo dentro do canvas (0 no chão, 1 no alto), para a sombra encolher junto
      lift: 0,
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
      return id;
    };

    // segurado: onde o botão desceu e, carregando, desde quando
    let hold: null | { id: number; x: number; y: number; chargeFrom: number } =
      null;
    let holdTimer = 0;
    let swallowClick = false;
    // no colo: o cursor e suas últimas posições (a velocidade sai delas)
    const ptr = { x: 0, y: 0 };
    const trail: { t: number; x: number; y: number }[] = [];
    const newCarry = (now: number) => ({
      // última vez que o cursor se mexeu, o lado para onde ia e quando virou (chacoalhar)
      movedAt: now,
      dir: 0,
      flips: [] as number[],
      kickAt: now + 1100,
      shakenAt: 0,
      held: false,
      high: false,
    });
    let carry = newCarry(0);
    // a reação mais recente no colo: só ela devolve o "animado" quando acaba
    let carryMood = 0;

    let gazeUntil = 0;
    function look(x: number, y: number, ms: number) {
      body!.gaze = { x, y };
      gazeUntil = performance.now() + ms;
      later(() => {
        if (performance.now() >= gazeUntil && s.mode === 'sit')
          body!.gaze = null;
      }, ms + 10);
    }

    // A cabeça dele na tela: para onde ele olha e em volta do que o mouse gira.
    const screenHead = () => ({
      x: s.x - window.scrollX,
      y: s.y - s.size * 0.5 - window.scrollY,
    });

    // O canvas é desenhado no tamanho em que o Kess aparece, não no tamanho base: bem menos pixels por quadro.
    let pixels = 0;
    function fitResolution(size: number) {
      const wanted = Math.round(size * (window.devicePixelRatio || 1) * 1.6);
      if (Math.abs(wanted - pixels) > pixels * 0.1) {
        pixels = wanted;
        body!.setAttribute('pixels', String(wanted));
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

      placeShadow();
    }

    // A sombra fica no chão, não grudada no Kess: some logo que ele sobe e reaparece no pouso.
    // Sem Kess à vista (escondido, chegando na página, espiando) não tem sombra.
    function placeShadow() {
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
      // no pulo dentro do canvas ela encolhe em volta do próprio centro (no transform, depois da posição:
      // a propriedade scale à parte também encolheria a posição e jogaria a sombra para cima)
      shadow!.style.opacity = String(0.3 * fade * (1 - s.lift * 0.8));
      shadow!.style.transform = `translate3d(${s.x - half}px, ${groundY - s.size * 0.012}px, 0) scale(${1 - s.lift * 0.4})`;
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

    // Para o que estiver fazendo (voo, pulo marcado, passeio) e sai do chão.
    function halt(mode: typeof s.mode) {
      s.flight = null;
      s.launch = null;
      s.hopTo = null;
      s.ground = null;
      s.mode = mode;
    }

    // Trocou de página: o chão antigo sumiu junto com a página (e a formação ainda pode estar
    // carregando). Ele some, espera o lugar dele na página nova aparecer e cai lá de cima.
    let arriveUntil = 0;
    function arrive() {
      halt('sit');
      s.placed = false;
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
      wave: () => body.wave(),
      hop: (power) => body.hop(power),
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
    // (rolar a página no meio do passeio encerra o passeio: ver onScroll)
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

    // Anda aos pulinhos pela borda do card, até `distance` px para um lado. Sem espaço, devolve false.
    function stroll(dir: number, distance: number, now: number) {
      const g = s.ground;
      if (!g || g.kind !== 'perch') return false;
      const to = clamp(s.x + dir * distance, g.left, g.right);
      if (Math.abs(to - s.x) <= 3) return false;
      s.lastIdleJump = now;
      s.hopTo = to;
      hopStep(now);
      return true;
    }

    function startFlight(
      to: Ground,
      toX: number,
      small: boolean,
      now: number,
      onLand?: () => void
    ) {
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
        onLand,
      };
      s.ground = null;
      s.mode = 'air';
      fitResolution(Math.max(s.size, to.size));
      body!.crouch = 0;
    }

    // Com movimento reduzido ele não voa: some e aparece no lugar novo.
    function settle(to: Ground, x: number, onLand?: () => void) {
      s.mode = 'prep'; // sem pulo marcado: só para nada mexer nele até aparecer
      s.launch = null;
      wrap!.style.opacity = '0';
      later(() => {
        place(to, x);
        s.mode = 'sit';
        render();
        wrap!.style.opacity = '1';
        onLand?.();
      }, 160);
    }

    // Antecipação: olha para onde vai, agacha e só então pula.
    function jumpTo(to: Ground, toX: number, now: number, small = false) {
      if (!small) s.hopTo = null;
      if (reduce) {
        settle(to, toX);
        return;
      }

      const dx = toX - s.x;
      const dy = to.feet - s.y;
      const offscreen =
        s.y + s.size * 0.2 < window.scrollY ||
        s.y - s.size > window.scrollY + window.innerHeight ||
        s.mode === 'peek';
      body!.gaze = {
        x: Math.abs(dx) < 4 ? 0 : Math.sign(dx) * 0.9,
        y: clamp(dy / 300, -0.7, 0.7),
      };
      body!.crouch = small ? -0.08 : -0.22;
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
      body!.crouch = 0;
      body!.squash(-clamp(impact / 700, f.step ? 1 : 1.2, 3));
      const ungaze = () => s.mode === 'sit' && (body!.gaze = null);
      if (!f.step) {
        const power = clamp(impact / 1800, 0, 1);
        if (impact > 1400) dust(s.x, s.y, power); // fantasma quase não levanta poeira
        if (impact > 800 && fresh.kind === 'perch') press(fresh.el, power);
        later(ungaze, 380);
      } else if (s.hopTo !== null && Math.abs(s.hopTo - s.x) > 3) {
        // emenda o próximo pulinho depois de uma pausa curta, como um bichinho saltitando
        later(() => hopStep(performance.now()), 110);
      } else {
        s.hopTo = null;
        later(ungaze, 300);
      }
      // chegou no fim da página
      if (fresh.el.tagName === 'FOOTER' && !s.saidFooter) {
        s.saidFooter = true;
        later(() => say(pick(lines.footer)), 250);
      }
      s.nextIdle = now + 4000 + Math.random() * 5000;
      s.dirty = true;
      f.onLand?.();
    }

    // Salta para outro card na tela, de preferência em outra coluna; com `delay`, olha para lá antes.
    // Sem card livre (ou com movimento reduzido), devolve false.
    let cardJumpTimer = 0;
    function cardJump(now: number, delay = 0) {
      const to =
        s.ground?.kind === 'perch' && !reduce ? otherPerch(s.ground) : null;
      if (!to) return false;
      const x = to.left + Math.random() * (to.right - to.left);
      s.lastIdleJump = s.lastCardJump = now;
      if (!delay) {
        jumpTo(to, x, now);
        return true;
      }
      look(x > s.x ? 1 : -1, to.feet < s.y ? -0.4 : 0.2, 500);
      cardJumpTimer = later(
        () => s.mode === 'sit' && jumpTo(to, x, performance.now()),
        delay
      );
      return true;
    }

    // Coisas à toa: só parado, acordado, sem ninguém segurando e com a página quieta
    // (a rolagem adia o próximo: ver onScroll).
    function idle(now: number) {
      if (
        reduce ||
        hold ||
        sleepRef.current !== 'awake' ||
        s.mode !== 'sit' ||
        !s.ground
      )
        return;
      s.nextIdle = now + 3500 + Math.random() * 4500;
      const roll = Math.random();
      const g = s.ground;
      const canJump = now - s.lastIdleJump > 7_000;
      // de vez em quando troca de card (ex.: pula de um projeto para outro, em outra coluna)
      if (
        canJump &&
        now - s.lastCardJump > 14_000 &&
        Math.random() < 0.5 &&
        !visibleSpot()
      ) {
        s.lastCardJump = now; // sem card livre agora, tenta de novo só mais tarde
        if (cardJump(now, 450)) return;
      }

      if (roll < 0.14 && now - s.lastSay > IDLE_LINE_MS) {
        // fala uma coisinha
        say(pick(lines.idle));
      } else if (
        roll < 0.55 &&
        canJump &&
        g.kind === 'perch' &&
        g.right - g.left > s.size * 2
      ) {
        // passeia pela borda do card
        // de 2 a 5 pulinhos para um lado (o que tiver mais espaço, às vezes o outro)
        const roomRight = g.right - s.x;
        const roomLeft = s.x - g.left;
        const dir = roomRight > roomLeft === Math.random() < 0.75 ? 1 : -1;
        stroll(dir, s.size * (1.6 + Math.random() * 3.4), now);
      } else if (roll < 0.68) {
        // olha em volta
        look(-0.9, -0.1, 700);
        later(() => s.mode === 'sit' && look(0.9, -0.1, 700), 750);
      } else if (roll < 0.76) {
        // espia o conteúdo do card
        look(0, 0.8, 1200);
      } else if (roll < 0.86) {
        // cantarola
        flash('feliz', 1700);
        emote('note');
        later(() => emote('note'), 600);
      } else if (roll < 0.95 || !canJump) {
        body!.wave();
      } else {
        s.lastIdleJump = now;
        body!.hop(2.6);
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
      // no meio de um pulo ou nas mãos de alguém, ele não procura outro lugar
      if (s.mode !== 'sit' && s.mode !== 'peek') return;
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

      const toSpot = (spot: Ground) => {
        if (s.ground?.el !== spot.el) {
          if (!s.ready) place(spot, spot.left);
          else jumpTo(spot, spot.left, now);
        } else if (
          Math.abs(spot.feet - s.y) > 1 ||
          Math.abs(spot.left - s.x) > 1
        ) {
          place(spot, spot.left);
        }
      };
      // o lugar dele no topo vem primeiro, a não ser que alguém tenha levado ele para outro canto
      if (spot && !s.placed) {
        toSpot(spot);
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
      // levaram ele para outro canto, mas não sobrou card na tela: aí, sim, volta para o lugar dele
      if (spot) {
        toSpot(spot);
        return;
      }

      if (s.mode !== 'peek') {
        s.mode = 'peek';
        s.ground = null;
        s.peekSince = now;
        setBaseMood('curioso');
        body!.gaze = { x: -0.7, y: -0.6 };
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
          body!.crouch = f.step
            ? clamp(Math.abs(vy) / 3000, 0, 0.1)
            : clamp(Math.abs(vy) / 3800, 0, 0.16);
          s.rot = clamp(
            f.vx / (f.step ? 90 : 110),
            f.step ? -5 : -7,
            f.step ? 5 : 7
          );
        }
      } else if (s.mode === 'charge') {
        // agacha cada vez mais e treme com a força guardada
        const k = charged(now);
        body!.crouch = -0.28 * k;
        s.rot = reduce ? 0 : Math.sin(now / 16) * 3 * k;
      } else if (s.mode === 'drag') {
        carried(now);
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

    // Rolando: ele acompanha o movimento com o olhar e não sai andando. O passeio e o pulo
    // de card que estavam para começar ficam para depois; à toa, só com a página quieta.
    function onScroll() {
      const now = performance.now();
      const dy = window.scrollY - s.lastScrollY;
      s.lastScrollY = window.scrollY;
      s.scrolledAt = now;
      s.hopTo = null;
      window.clearTimeout(cardJumpTimer);
      s.nextIdle = Math.max(s.nextIdle, now + QUIET_MS);
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

    // fala puxada por interação (pegar no colo, seleção…): não corta o balão que ainda está na tela
    function remark(options: readonly string[]) {
      if (!s.bubble) say(pick(options));
    }

    // ---------- no colo: segurar, carregar o pulão e arrastar ----------
    // Segurar parado: ele agacha e treme cada vez mais; ao soltar, pula (carga cheia: salta para outro card).
    // Segurar e mover: ele fica pendurado no cursor e, solto, flutua até a borda logo abaixo.
    function charged(now: number) {
      return hold?.chargeFrom
        ? clamp((now - hold.chargeFrom) / CHARGE_MS, 0, 1)
        : 0;
    }

    // Velocidade do cursor no colo (px/s), pelos movimentos dos últimos THROW_MS.
    // Se ele parou o mouse um instante antes, é zero (soltou parado: não foi arremesso).
    function velocity(now: number) {
      const last = trail[trail.length - 1];
      let i = trail.length - 2;
      if (!last || i < 0 || now - last.t >= THROW_MS) return { x: 0, y: 0 };
      while (i > 0 && last.t - trail[i - 1].t <= THROW_MS) i--;
      const dt = (last.t - trail[i].t) / 1000;
      if (dt <= 0) return { x: 0, y: 0 };
      return { x: (last.x - trail[i].x) / dt, y: (last.y - trail[i].y) / dt };
    }

    // reação passageira no colo; quando acaba, ele volta a ficar animado
    function carriedMood(mood: KessMood, ms: number) {
      flash(mood, ms);
      const id = ++carryMood;
      later(() => {
        if (id === carryMood && s.mode === 'drag') flash('animado', 30_000);
      }, ms);
    }

    function pickUp() {
      window.clearTimeout(holdTimer);
      halt('drag');
      carry = newCarry(performance.now());
      // um susto: estica de uma vez e fica pendurado, olhando para baixo
      body!.crouch = 0.1;
      body!.squash(3);
      body!.gaze = { x: 0, y: 0.6 };
      carriedMood('surpreso', 700);
      remark(lines.grab);
      wake();
    }

    // Pendurado pela cabeça: o corpo fica para trás do movimento e volta ao prumo devagar.
    // Olha para onde está indo e, parado no ar, balança as perninhas.
    function carried(now: number) {
      const v = velocity(now);
      const swing = clamp(v.x / 60, -24, 24) * (reduce ? 0.3 : 1);
      s.rot += (swing - s.rot) * 0.25;
      const a = (s.rot * Math.PI) / 180;
      const h = s.size * 0.78;
      s.x = ptr.x + window.scrollX - h * Math.sin(a);
      s.y = ptr.y + window.scrollY + h * Math.cos(a);
      body!.gaze = { x: v.x / 900, y: 0.6 + v.y / 900 };

      const still = now - carry.movedAt;
      if (!reduce && still > 400 && now >= carry.kickAt) {
        carry.kickAt = now + 1100;
        body!.wave();
      }
      // segurado parado no ar por um bom tempo: fica sem graça
      if (still > 3500 && !carry.held) {
        carry.held = true;
        carriedMood('timido', 2600);
        remark(lines.held);
      }
    }

    // Chacoalhar (vai e volta rápido, várias vezes em 1 s) deixa ele tonto; levantar lá no alto, assustado.
    function carryMove(dx: number, dy: number, now: number) {
      if (Math.abs(dx) + Math.abs(dy) > 1) carry.movedAt = now;
      if (Math.abs(dx) > 6 && Math.sign(dx) !== carry.dir) {
        carry.dir = Math.sign(dx);
        carry.flips = [...carry.flips.filter((t) => now - t < 1000), now];
        if (carry.flips.length >= 4 && now - carry.shakenAt > 4000) {
          carry.shakenAt = now;
          carry.flips = [];
          carriedMood('tonto', 1800);
          emote('sweat');
          say(pick(lines.shaken));
        }
      }
      if (!carry.high && hold && ptr.y < 90 && hold.y - ptr.y > 100) {
        carry.high = true;
        carriedMood('surpreso', 1200);
        emote('sweat');
        say(pick(lines.high));
      }
    }

    function drop() {
      const now = performance.now();
      const v = velocity(now);
      const thrown = Math.hypot(v.x, v.y) > THROW_SPEED;
      trail.length = 0;
      body!.crouch = 0;
      body!.gaze = null;
      s.rot = 0;
      s.lastIdleJump = now;
      const react = () => {
        if (thrown) {
          flash('tonto', 2400);
          say(pick(lines.thrown));
        } else {
          flash('feliz', 1400);
          if (Math.random() < 0.5) say(pick(lines.dropped));
        }
      };
      const to = perchBelow(s.x, s.y, s.size) ?? visibleSpot();
      s.placed = !!to;
      if (!to) {
        // nada na tela onde pousar: ele mesmo decide (espia da borda)
        s.mode = 'sit';
        react();
        wake();
        return;
      }
      const x = clamp(s.x, to.left, to.right);
      if (reduce) settle(to, x, react);
      else startFlight(to, x, false, now, react);
      wake();
    }

    function releaseCharge(k: number) {
      s.mode = 'sit';
      s.rot = 0;
      body!.crouch = 0;
      // carga cheia: salta para outro card
      if (k >= 1 && cardJump(performance.now())) {
        s.placed = true;
        flash('animado', 1800);
        remark(lines.charged);
        return;
      }
      flash(k > 0.6 ? 'animado' : 'feliz', 1400);
      body!.hop(3 + 1.2 * k);
      render();
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType === 'touch') return;
      if (s.mode !== 'sit' && s.mode !== 'peek') return;
      e.preventDefault(); // sem selecionar texto nem arrastar a imagem do navegador
      const h = { id: e.pointerId, x: e.clientX, y: e.clientY, chargeFrom: 0 };
      hold = h;
      s.hopTo = null; // segurou no meio do passeio: ele para
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      trail.length = 0;
      body.setPointerCapture(e.pointerId);
      // segurou parado: começa a carregar o pulão (espiando da borda, não)
      holdTimer = window.setTimeout(() => {
        if (s.mode !== 'sit') return;
        h.chargeFrom = performance.now();
        s.mode = 'charge';
        flash('concentrado', 20_000);
        // sua com a força e, com a carga cheia, solta uma faísca
        const charging = () => hold === h && s.mode === 'charge';
        later(() => charging() && emote('sweat'), CHARGE_MS * 0.6);
        later(() => charging() && emote('sparkle'), CHARGE_MS);
        wake();
      }, HOLD_MS);
    };
    const onPtrMove = (e: PointerEvent) => {
      if (!hold || e.pointerId !== hold.id) return;
      const now = performance.now();
      const dx = e.clientX - ptr.x;
      const dy = e.clientY - ptr.y;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      trail.push({ t: now, x: e.clientX, y: e.clientY });
      if (trail.length > 8) trail.shift();
      if (s.mode === 'drag') carryMove(dx, dy, now);
      else if (Math.hypot(e.clientX - hold.x, e.clientY - hold.y) >= DRAG_PX)
        pickUp();
    };
    const onUp = (e: PointerEvent) => {
      if (!hold || e.pointerId !== hold.id) return;
      const k = e.type === 'pointercancel' ? 0 : charged(performance.now());
      hold = null;
      window.clearTimeout(holdTimer);
      // o clique que vem logo depois de arrastar ou carregar não conta como cutucada
      swallowClick = s.mode === 'drag' || s.mode === 'charge';
      if (s.mode === 'drag') drop();
      else if (s.mode === 'charge') releaseCharge(k);
      if (swallowClick) window.setTimeout(() => (swallowClick = false), 0);
    };
    const onClickCapture = (e: MouseEvent) => {
      if (!swallowClick) return;
      e.stopPropagation();
      e.preventDefault();
    };

    // ---------- reações ----------
    function lookAtRect(r: DOMRect, ms: number) {
      const head = screenHead();
      look(
        (r.left + r.width / 2 - head.x) / 420,
        (r.top + r.height / 2 - head.y) / 320,
        ms
      );
    }

    // olha para onde o foco do teclado foi (link, botão…); o foco que vem de um clique não conta
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target;
      if (s.mode !== 'sit' || !(t instanceof Element) || host.contains(t))
        return;
      if (t.matches(':focus-visible'))
        lookAtRect(t.getBoundingClientRect(), 1400);
    };

    // olha para o texto selecionado e, de vez em quando, lembra que dá para copiar
    let selTimer = 0;
    let lastSelect = 0;
    const onSelection = () => {
      window.clearTimeout(selTimer);
      if (s.mode !== 'sit') return;
      selTimer = window.setTimeout(() => {
        const sel = document.getSelection();
        if (s.mode !== 'sit' || !sel || sel.isCollapsed || !sel.rangeCount)
          return;
        const range = sel.getRangeAt(0);
        // uma palavra solta não conta (seleção longa, que passa de um trecho a outro, nem vira texto)
        if (
          range.startContainer === range.endContainer &&
          range.toString().trim().length < 12
        )
          return;
        const r = range.getBoundingClientRect();
        if (!r.width) return;
        lookAtRect(r, 1800);
        const now = performance.now();
        if (now - lastSelect > 30_000) {
          lastSelect = now;
          flash('curioso', 1400);
          remark(lines.select);
        }
      }, 500);
    };

    // o mouse dando voltas em volta dele (duas voltas em 3 s): fica tonto
    let turn = 0;
    let lastAngle: number | null = null;
    let turnFrom = 0;
    let lastDizzy = 0;
    const resetTurn = (now: number) => {
      turn = 0;
      lastAngle = null;
      turnFrom = now;
    };
    const onWindowMove = (e: PointerEvent) => {
      if (s.mode !== 'sit' || hold || e.pointerType === 'touch') return;
      const head = screenHead();
      const dx = e.clientX - head.x;
      const dy = e.clientY - head.y;
      const dist = Math.hypot(dx, dy);
      if (dist < s.size * 0.4 || dist > s.size * 3.5) {
        lastAngle = null; // saiu de perto: volta a contar do zero quando voltar
        return;
      }
      const now = performance.now();
      const a = Math.atan2(dy, dx);
      if (lastAngle === null || now - turnFrom > 3000) resetTurn(now);
      else {
        let d = a - lastAngle;
        if (d > Math.PI) d -= 2 * Math.PI;
        else if (d < -Math.PI) d += 2 * Math.PI;
        turn += d;
      }
      lastAngle = a;
      if (Math.abs(turn) > 4 * Math.PI && now - lastDizzy > 15_000) {
        lastDizzy = now;
        resetTurn(now);
        flash('tonto', 2600);
        say(pick(lines.dizzy));
      }
    };

    // duplo clique: uma pirueta; três seguidas deixam ele tonto
    let spins: number[] = [];
    const onDblClick = () => {
      if (s.mode !== 'sit' || reduce) return;
      const now = performance.now();
      spins = [...spins.filter((t) => now - t < 4000), now];
      body.animate([{ rotate: '0deg' }, { rotate: '360deg' }], {
        duration: 700,
        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
      });
      if (spins.length < 3) {
        emote('sparkle');
        return;
      }
      spins = [];
      later(() => {
        flash('tonto', 2200);
        say(pick(lines.spun));
      }, 700);
    };

    // com o foco nele, as setas fazem ele andar (← →) e pular para outro card (↑)
    const onKeyNav = (e: KeyboardEvent) => {
      if (s.mode !== 'sit' || !s.ground) return;
      const now = performance.now();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (stroll(e.key === 'ArrowRight' ? 1 : -1, s.size * 1.6, now)) return;
        // sem espaço para aquele lado: balança e estranha
        if (e.repeat) return;
        body.wave();
        emote('question');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (cardJump(now)) s.placed = true;
        else body.hop(3.6);
      }
    };

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
      s.lift = (e as CustomEvent<number>).detail;
      placeShadow();
    };
    const resize = new ResizeObserver(wake);
    resize.observe(document.body);

    const listeners = new AbortController();
    const signal = listeners.signal;
    body.addEventListener('pointerenter', petStart, { signal });
    body.addEventListener('pointerleave', petEnd, { signal });
    body.addEventListener('pointerdown', onDown, { signal });
    body.addEventListener('pointermove', onPtrMove, { signal });
    body.addEventListener('pointerup', onUp, { signal });
    body.addEventListener('pointercancel', onUp, { signal });
    body.addEventListener('dblclick', onDblClick, { signal });
    body.addEventListener('keydown', onKeyNav, { signal });
    wrap.addEventListener('click', onClickCapture, { capture: true, signal });
    wrap.addEventListener('kess-lift', onLift, { signal });
    document.addEventListener('focusin', onFocusIn, { signal });
    document.addEventListener('selectionchange', onSelection, { signal });
    window.addEventListener('pointermove', onWindowMove, {
      passive: true,
      signal,
    });
    window.addEventListener('scroll', onScroll, { passive: true, signal });
    window.addEventListener('resize', wake, { signal });
    wake();

    return () => {
      actions.current = null;
      listeners.abort();
      cancelAnimationFrame(raf);
      window.clearInterval(idleTimer);
      window.clearTimeout(settleTimer);
      window.clearTimeout(petTimer);
      window.clearTimeout(holdTimer);
      window.clearTimeout(selTimer);
      timers.forEach((id) => window.clearTimeout(id));
      if (s.bubble) {
        window.clearTimeout(s.bubble.timer);
        s.bubble.el.remove();
      }
      mutations.disconnect();
      resize.disconnect();
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
      if (firstInSession(HELLO_KEY)) {
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
    if (count === 1 && firstInSession(HINT_KEY))
      window.setTimeout(() => actions.current?.say(pick(lines.hint)), 900);
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
          label="Kess, mascote do Kessleru. Clique para ele pular, segure para um pulão ou arraste para levar ele a outro lugar. Com o foco nele, as setas fazem ele andar."
        />
      </div>
    </>,
    layer
  );
}

export default KessCompanion;
