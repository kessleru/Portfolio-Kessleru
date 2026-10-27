import { useSyncExternalStore } from 'react';

// Versão simples do site: só texto, uma coluna, sem cards, sem Kess e sem animação.
// Fica salva no navegador; o index.html marca o <html> antes da primeira pintura.
const KEY = 'portfolio-simples';
const EVENT = 'simple-mode';

export function getSimple() {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
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
