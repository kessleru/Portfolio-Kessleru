import { useSyncExternalStore } from 'react';

// Idioma do site: português (padrão) ou inglês. Fica salvo no navegador.
// Quem nunca escolheu vê inglês só se o navegador não estiver em português.
export type Lang = 'pt' | 'en';

const KEY = 'portfolio-lang';
const EVENT = 'lang-change';

const byDefault: Lang =
  typeof navigator !== 'undefined' && !/^pt\b/i.test(navigator.language || 'pt')
    ? 'en'
    : 'pt';

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'pt';
  try {
    const chosen = localStorage.getItem(KEY);
    return chosen === 'pt' || chosen === 'en' ? chosen : byDefault;
  } catch {
    return byDefault;
  }
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // sem localStorage: vale só para esta visita
  }
  document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

/** Texto nos dois idiomas. */
export type Tx = { pt: string; en: string };

/** Fora de componentes (falas do Kess, dados): lê o idioma da hora. */
export function tr(pt: string, en: string) {
  return getLang() === 'en' ? en : pt;
}

export const tx = (v: Tx | string, lang: Lang = getLang()) =>
  typeof v === 'string' ? v : v[lang];

/** Em componentes: redesenha ao trocar de idioma. `t('texto', 'text')`. */
export function useLang() {
  const lang = useSyncExternalStore(subscribe, getLang, () => 'pt' as Lang);
  const t = (pt: string, en: string) => (lang === 'en' ? en : pt);
  return { lang, t, locale: lang === 'en' ? 'en-US' : 'pt-BR' };
}
