// O que o Kess fala: pouco, curto e útil. Nada de fala só para encher.
import { greetings, greetingsEn, periodOf } from '@/lib/period';
import { getLang } from '@/lib/i18n';

const pick = <T>(list: readonly T[]) =>
  list[Math.floor(Math.random() * list.length)];

/** Primeira frase da visita, pelo mesmo relógio da página inicial (src/lib/period.ts). */
export function greeting(now = new Date()) {
  const period = periodOf(now);
  // de madrugada ele estranha a hora
  const en = getLang() === 'en';
  if (period === 'madrugada')
    return en
      ? pick(['still up?', 'good night!'])
      : pick(['boa madrugada!', 'ainda acordado?']);
  return `${(en ? greetingsEn : greetings)[period]}!`;
}

/** Ao chegar numa página (a partir da segunda da visita). */
const pageLinesPt: Record<string, readonly string[]> = {
  '/projects': ['clique num card para ver o código'],
  '/training': ['clique num commit para ver os detalhes'],
  '/contact': ['essa página ainda está em construção'],
  '404': ['essa página não existe', 'acho que esse link quebrou'],
};

const linesPt = {
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

const pageLinesEn: Record<string, readonly string[]> = {
  '/projects': ['click a card to see the code'],
  '/training': ['click a commit to see the details'],
  '/contact': ['this page is still under construction'],
  '404': ["this page doesn't exist", 'i think this link is broken'],
};

const linesEn: Record<keyof typeof linesPt, readonly string[]> = {
  back: ['glad you came back'],
  copy: ['copied!'],
  called: ['you called?'],
  theme: ['looks good', 'i like this theme'],
  accent: ['it matches me'],
  footer: ['thanks for reading this far'],
  grab: ['whoa!', 'where are we going?'],
  shaken: ['put me down!', 'easy!'],
  held: ['you can let go whenever you want'],
  high: ['so high!'],
  dropped: ['thanks for the ride'],
  thrown: ['what a trip!', "i'm dizzy"],
  charged: ['here i go!'],
  spun: ['enough spinning'],
  dizzy: ["i'm getting dizzy"],
  select: ['want to copy? just press Ctrl+C'],
  hint: ['you can grab me and drag me around'],
  idle: [
    'you can change the theme in Theme.tsx',
    'my education became a git graph',
    'the projects link to their code',
  ],
};

// As falas seguem o idioma do site na hora em que o Kess fala.
export const pageLines = new Proxy(pageLinesPt, {
  get: (pt, key: string) => (getLang() === 'en' ? pageLinesEn : pt)[key],
});

export const lines = new Proxy(linesPt, {
  get: (pt, key: string) =>
    (getLang() === 'en' ? linesEn : pt)[key as keyof typeof linesPt],
}) as Record<keyof typeof linesPt, readonly string[]>;

export { pick };
