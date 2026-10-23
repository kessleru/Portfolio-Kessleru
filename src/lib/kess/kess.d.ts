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
}

type KessMascotAttributes = HTMLAttributes<KessMascotElement> & {
  ref?: Ref<KessMascotElement>;
  mood?: KessMood;
  size?: KessSize;
  /** Cor da bolinha (qualquer cor CSS). Sem ela, usa a cor da emoção. */
  color?: string;
  'no-hop'?: '' | undefined;
  'no-follow'?: '' | undefined;
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
