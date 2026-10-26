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
