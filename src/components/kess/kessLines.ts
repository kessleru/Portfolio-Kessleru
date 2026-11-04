// O que o Kess fala: pouco, curto e útil. Nada de fala só para encher.
import { greetings, periodOf } from '@/lib/period';

const pick = <T>(list: readonly T[]) =>
  list[Math.floor(Math.random() * list.length)];

/** Primeira frase da visita, pelo mesmo relógio da página inicial (src/lib/period.ts). */
export function greeting(now = new Date()) {
  const period = periodOf(now);
  // de madrugada ele estranha a hora
  if (period === 'madrugada')
    return pick(['boa madrugada!', 'ainda acordado?']);
  return `${greetings[period]}!`;
}

/** Ao chegar numa página (a partir da segunda da visita). */
export const pageLines: Record<string, readonly string[]> = {
  '/projects': ['clique num card para ver o código'],
  '/training': ['clique num commit para ver os detalhes'],
  '/contact': ['essa página ainda está em construção'],
  '404': ['essa página não existe', 'acho que esse link quebrou'],
};

export const lines = {
  back: ['que bom que voltou'],
  copy: ['copiado!'],
  called: ['me chamou?'],
  theme: ['ficou bom', 'gostei desse tema'],
  accent: ['combinou comigo'],
  footer: ['obrigado por ler até aqui'],
  // no colo: pego, chacoalhado, parado no ar, lá no alto, solto devagar ou arremessado
  grab: ['opa!', 'pra onde a gente vai?'],
  shaken: ['me põe no chão!', 'devagar!'],
  held: ['pode me soltar quando quiser'],
  high: ['que alto!'],
  dropped: ['obrigado pela carona'],
  thrown: ['que viagem!', 'tô tonto'],
  // pulão com carga cheia e piruetas demais
  charged: ['lá vou eu!'],
  spun: ['chega de pirueta'],
  dizzy: ['tô ficando tonto'],
  select: ['quer copiar? é só Ctrl+C'],
  hint: ['dá para me segurar e me arrastar'],
  // de vez em quando, parado: dicas do próprio site
  idle: [
    'dá para trocar o tema no Theme.tsx',
    'a formação virou um grafo do git',
    'os projetos têm link para o código',
  ],
} as const;

export { pick };
