// Emotes (coração, zzz, !, ?, ♪…) que saem da cabeça do Kess, e o balão de fala.
// São elementos da página (não do canvas): texto nítido, cores do tema e nenhum custo no WebGL.

export type Emote =
  | 'heart'
  | 'z'
  | 'bang'
  | 'question'
  | 'sparkle'
  | 'note'
  | 'sweat'
  | 'anger'
  | 'star';

const svg = (path: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;

const ICONS: Record<Emote, { color: string; html: string }> = {
  heart: {
    color: 'var(--ctp-pink)',
    html: svg(
      'M12 21s-7.4-4.5-9.5-9.1C1 8.5 3.1 4.6 6.8 4.6c2.2 0 3.7 1.3 5.2 3.2 1.5-1.9 3-3.2 5.2-3.2 3.7 0 5.8 3.9 4.3 7.3C19.4 16.5 12 21 12 21z'
    ),
  },
  z: { color: 'var(--ctp-teal)', html: 'z' },
  bang: { color: 'var(--ctp-yellow)', html: '!' },
  question: { color: 'var(--ctp-sky)', html: '?' },
  sparkle: {
    color: 'var(--ctp-yellow)',
    html: svg(
      'M12 1.5c.7 5.3 3.2 7.8 8.5 8.5-5.3.7-7.8 3.2-8.5 8.5-.7-5.3-3.2-7.8-8.5-8.5 5.3-.7 7.8-3.2 8.5-8.5z'
    ),
  },
  note: {
    color: 'var(--ctp-mauve)',
    html: svg(
      'M9 3.5 20 1v14.3a3.3 3.3 0 1 1-2-3V6.1l-7 1.6v9.6a3.3 3.3 0 1 1-2-3z'
    ),
  },
  sweat: {
    color: 'var(--ctp-blue)',
    html: svg('M12 2.5s6.5 7.4 6.5 12a6.5 6.5 0 0 1-13 0c0-4.6 6.5-12 6.5-12z'),
  },
  anger: {
    color: 'var(--ctp-red)',
    html: svg(
      'M9.5 2.5c.4 3.4-.6 5.6-3.4 6.4-1.3.4-2.8.2-4.1-.5.8 1.7 2.4 2.9 4.3 3 3.3.1 4.8-2.5 4.6-5.9zm5 0c-.4 3.4.6 5.6 3.4 6.4 1.3.4 2.8.2 4.1-.5-.8 1.7-2.4 2.9-4.3 3-3.3.1-4.8-2.5-4.6-5.9zm-5 19c.4-3.4-.6-5.6-3.4-6.4-1.3-.4-2.8-.2-4.1.5.8-1.7 2.4-2.9 4.3-3 3.3-.1 4.8 2.5 4.6 5.9zm5 0c-.4-3.4.6-5.6 3.4-6.4 1.3-.4 2.8-.2 4.1.5-.8-1.7-2.4-2.9-4.3-3-3.3-.1-4.8 2.5-4.6 5.9z'
    ),
  },
  star: {
    color: 'var(--ctp-yellow)',
    html: svg(
      'm12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8z'
    ),
  },
};

const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

/** Solta um emote a partir de (x, y), em coordenadas da página. */
export function spawnEmote(
  layer: HTMLElement,
  kind: Emote,
  x: number,
  y: number,
  size: number,
  reduce: boolean
) {
  const icon = ICONS[kind];
  const el = document.createElement('span');
  el.className = 'kess-emote';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = icon.html;
  el.style.color = icon.color;
  const px = Math.round(clampSize(size * 0.34));
  el.style.width = el.style.height = el.style.fontSize = `${px}px`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  layer.appendChild(el);

  const drift = (Math.random() - 0.35) * size * 0.35;
  const tilt = (Math.random() - 0.5) * 24;
  const frames: Keyframe[] = reduce
    ? [
        { opacity: 0, transform: 'translate(-50%, -100%)' },
        { opacity: 1, offset: 0.2 },
        { opacity: 1, offset: 0.75 },
        { opacity: 0, transform: 'translate(-50%, -100%)' },
      ]
    : kind === 'z'
      ? [
          { opacity: 0, transform: 'translate(-50%, -100%) scale(0.6)' },
          { opacity: 1, offset: 0.25 },
          {
            opacity: 0,
            transform: `translate(calc(-50% + ${size * 0.45}px), -${100 + 220}%) scale(1.3) rotate(12deg)`,
          },
        ]
      : [
          {
            opacity: 0,
            transform: `translate(-50%, -60%) scale(0.5) rotate(${-tilt}deg)`,
          },
          {
            opacity: 1,
            transform: `translate(-50%, -110%) scale(1.12) rotate(${tilt * 0.3}deg)`,
            offset: 0.22,
          },
          {
            opacity: 1,
            transform: `translate(calc(-50% + ${drift}px), -170%) scale(1) rotate(0deg)`,
            offset: 0.7,
          },
          {
            opacity: 0,
            transform: `translate(calc(-50% + ${drift * 1.4}px), -220%) scale(0.92)`,
          },
        ];

  el.animate(frames, {
    duration: kind === 'z' ? 1800 : 1250,
    easing: kind === 'z' ? 'ease-out' : EASE,
  }).finished.then(
    () => el.remove(),
    () => el.remove()
  );
}

const clampSize = (value: number) => Math.min(Math.max(value, 14), 26);

/** Balão de fala. Quem chama posiciona (ele acompanha o Kess) e remove com hideBubble. */
export function createBubble(
  layer: HTMLElement,
  text: string,
  reduce: boolean
) {
  const el = document.createElement('span');
  el.className = 'kess-bubble';
  el.setAttribute('aria-hidden', 'true');
  el.textContent = text;
  layer.appendChild(el);
  el.animate(
    reduce
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [
          { opacity: 0, scale: '0.85', translate: '0 4px' },
          { opacity: 1, scale: '1', translate: '0 0' },
        ],
    { duration: 220, easing: EASE }
  );
  return el;
}

export function hideBubble(el: HTMLElement) {
  el.animate([{ opacity: 1 }, { opacity: 0, scale: '0.95' }], {
    duration: 140,
    easing: 'ease-out',
    fill: 'forwards',
  }).finished.then(
    () => el.remove(),
    () => el.remove()
  );
}
