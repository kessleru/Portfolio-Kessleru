import { useSyncExternalStore } from 'react';
import { SMALL_SCREEN } from '@/components/kess/kessPreference';

// Versão simples do site: só texto, uma coluna, sem cards, sem Kess e sem animação.
// Fica salva no navegador; o index.html marca o <html> antes da primeira pintura.
const KEY = 'portfolio-simples';
const EVENT = 'simple-mode';

// No celular ela é o padrão até a pessoa escolher uma versão. Decidido uma vez, ao abrir:
// girar a tela ou mudar o tamanho da janela não troca de versão no meio da leitura.
const byDefault =
  typeof window !== 'undefined' && window.matchMedia(SMALL_SCREEN).matches;

export function getSimple() {
  try {
    const chosen = localStorage.getItem(KEY);
    return chosen === null ? byDefault : chosen === 'on';
  } catch {
    return byDefault;
  }
}

export function setSimple(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // sem localStorage: vale só para esta visita
  }
  document.documentElement.toggleAttribute('data-simple', on);
  window.dispatchEvent(new Event(EVENT));
  window.scrollTo(0, 0);
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useSimple() {
  return useSyncExternalStore(subscribe, getSimple, () => false);
}
