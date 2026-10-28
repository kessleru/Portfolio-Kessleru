// O que o Kess fala: pouco, curto e útil. Nada de fala só para encher.

const pick = <T>(list: readonly T[]) =>
  list[Math.floor(Math.random() * list.length)];

/** Primeira frase da visita, pela hora. */
export function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'bom dia!';
  if (hour >= 12 && hour < 18) return 'boa tarde!';
  return 'boa noite!';
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
  // no colo: pego, solto devagar ou arremessado
  grab: ['opa!', 'pra onde a gente vai?'],
  dropped: ['obrigado pela carona'],
  thrown: ['que viagem!', 'tô tonto'],
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
