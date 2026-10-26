import type { KessMood } from '@/lib/kess/kess';
import type { Emote } from './kessEmotes';

// Se o visitante quer o Kess andando pelo site. Fica salvo no navegador, como o tema.
const KEY = 'portfolio-kess';
const EVENT = 'kess-preference';

export function getKessEnabled() {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setKessEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? 'on' : 'off');
  } catch {
    // sem localStorage (aba anônima bloqueada): vale só para esta visita
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeKess(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// No celular (tela estreita, ou de toque deitada) o Kess não aparece e nem é baixado.
// A mesma regra está no index.css (.kess-only), para o lugar dele não sobrar vazio.
const SMALL_SCREEN =
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
