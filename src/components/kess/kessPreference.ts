import type { KessMood } from '@/lib/kess/kess';
import type { Emote } from './kessEmotes';

// No celular (tela estreita, ou de toque deitada) o Kess não aparece e nem é baixado, e o site
// abre na versão simples (simpleMode.ts). A mesma regra está no index.css (.kess-only), para o
// lugar dele não sobrar vazio, e no index.html, que marca a versão simples antes da primeira pintura.
export const SMALL_SCREEN =
  '(max-width: 767px), (pointer: coarse) and (max-height: 520px)';

export function kessFitsScreen() {
  return !window.matchMedia(SMALL_SCREEN).matches;
}

export function subscribeScreen(callback: () => void) {
  const media = window.matchMedia(SMALL_SCREEN);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

// Qualquer parte do site pode pedir uma reação ao Kess (ele ignora se estiver escondido).
export type KessEventDetail = {
  say?: string;
  mood?: KessMood;
  ms?: number;
  emote?: Emote;
};
export const KESS_EVENT = 'kess';

export function kessEvent(detail: KessEventDetail) {
  window.dispatchEvent(new CustomEvent(KESS_EVENT, { detail }));
}
