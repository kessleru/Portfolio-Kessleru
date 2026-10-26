// Tipos do Web Component <kess-mascot> (kess.js), vindo de github.com/kessleru/kess-mascot.

import type { HTMLAttributes, Ref } from 'react';

export type KessMood =
  | 'normal'
  | 'feliz'
  | 'animado'
  | 'curioso'
  | 'pensativo'
  | 'surpreso'
  | 'triste'
  | 'confuso'
  | 'bravo'
  | 'sono'
  | 'apaixonado'
  | 'concentrado'
  | 'inspiracao';

/** Número (px), medida CSS ('5rem', 'clamp(...)') ou atalho. */
export type KessSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | (string & {});

export interface KessMascotElement extends HTMLElement {
  mood: KessMood;
  size: KessSize | null;
  hop(power?: number): void;
  /** Direção do olhar (-1..1); null volta a seguir o cursor. */
  gaze: { x: number; y: number } | null;
  /** Postura alvo do corpo: negativo agacha, positivo estica (-0.3..0.3). */
  crouch: number;
  /** Impulso na mola do corpo, como o impacto de um pouso. */
  squash(impulse: number): void;
}

type KessMascotAttributes = HTMLAttributes<KessMascotElement> & {
  ref?: Ref<KessMascotElement>;
  mood?: KessMood;
  size?: KessSize;
  /** Cor da bolinha (qualquer cor CSS). Sem ela, usa a cor da emoção. */
  color?: string;
  'no-hop'?: '' | undefined;
  'no-follow'?: '' | undefined;
  /** Apoiado em algo da página: sem sombra própria e sem flutuar. */
  grounded?: '' | undefined;
  /** Limite de pixels do canvas, para quando ele aparece reduzido por CSS. */
  pixels?: number;
};

declare global {
  interface HTMLElementTagNameMap {
    'kess-mascot': KessMascotElement;
  }
  interface HTMLElementEventMap {
    'kess-poke': CustomEvent;
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'kess-mascot': KessMascotAttributes;
    }
  }
}

export {};
