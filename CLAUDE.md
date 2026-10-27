# Portfolio Kessleru

Portfólio pessoal do Otávio Kessler Ustra (kessleru), publicado em https://kessleru.com.br (Vercel).
React 19 + TypeScript + Vite 7 + Tailwind v4 + Catppuccin. Gerenciador: **pnpm**.

## Comandos

- `pnpm dev`: servidor em http://localhost:5173
- `pnpm build`: `tsc -b` + `vite build` + `scripts/prerender.mjs` (HTML de cada rota, sitemap)
- `pnpm lint`: hoje há 1 erro antigo e conhecido (`react-refresh/only-export-components` em `ThemeProvider.tsx`)
- Formatação: `npx prettier --single-quote --trailing-comma es5 --write <arquivos>`

## Fluxo de trabalho

- Terminou: commit e push direto na `main`, sem PR e sem pedir aprovação ou mandar fotos
  (mas confira você mesmo: build, navegador e teste de rolagem do Kess).
- Commits **sem coautoria** (sem `Co-Authored-By`, sem `Claude-Session`). Autor:
  `Otávio Kessler Ustra <90390195+kessleru@users.noreply.github.com>`.
- Mensagens de commit em português, no formato `tipo: descrição` (`feat:`, `fix:`, `style:`…).
- Antes de commitar: `git fetch origin main` e trazer o que o Otávio fez na `main`.
- **Não mexer em `src/pages/Projects.tsx`** sem pedir: o Otávio edita essa página.

## Textos

- Tudo em português do Brasil, frases curtas e naturais; sem "eyebrows" (rótulos em caixa alta acima de títulos).
- O site imita o VS Code: cards têm aba de arquivo (`Profile.tsx`), caminho `~/página/`, rodapé de status.
  Referências de editor/git só quando ajudam a ler a informação; nada forçado (hash, `HEAD ->`, `chore:`).

## Visual

- Cores só pelos tokens do Catppuccin (`text-ctp-*`, `bg-ctp-*`, `--ctp-accent`); nada de hex solto.
- Texto pequeno e metadados (datas, contagens, rótulos) em `text-ctp-meta`, que passa 4,5:1 nos 4 temas.
  Não usar `overlay-0`/`overlay-1` em texto.
- Números que mudam ou se alinham: `tabular-nums`.
- Texto corrido (parágrafos) usa `prose-text`: fonte do sistema sem serifa, 16–17px, altura de linha 1,7,
  ~65 caracteres por linha. A mono fica para títulos, rótulos, datas e código.
- Nada se mexe sozinho sem parar enquanto a pessoa lê (sem marquee/carrossel automático).
- Toda página também precisa funcionar na versão simples (`src/components/simple`, `useSimple()`):
  uma coluna, sem cards, sem Kess, sem animação.
- Todo bloco é um `<Card fileName="Nome.tsx">`; a aba aparece no hover/foco (com mouse) e some no toque (celular).

## Animação

- Interface abaixo de 300 ms; saída mais rápida que entrada; ease-out forte
  (`cubic-bezier(0.23, 1, 0.32, 1)`); nunca `ease-in`; nunca começar de `scale(0)`.
- Animar só `transform`/`opacity` (e `translate`/`rotate`/`scale` individuais). Nunca `transition-all`.
- Hover só com `@media (hover: hover) and (pointer: fine)`; botões já têm `scale: 0.97` no `:active`.
- `prefers-reduced-motion`: menos movimento, não zero. Toda animação infinita precisa parar.
- Motion (`motion/react`) só na página de formação (pedaço separado do bundle); no resto, CSS ou WAAPI.

## Kess (mascote)

- Existe um Kess só, o `KessCompanion`. Páginas **não** renderizam `<Kess>`: marcam lugares.
  - `<KessSpot mood="…" size="…" />` no topo da página.
  - `data-kess-perch` em bordas onde ele pode sentar (todo `Card` já tem).
  - `data-kess-mood="animado"` (ou outra emoção) em elementos interativos para ele reagir no hover.
- Ele não pode se mover enquanto a página rola (só depois de `SETTLE_MS`). Mudou o comportamento?
  Teste rolando rápido para cima e para baixo, sobretudo no início.

## SEO e acessibilidade

- `/ci` é uma rota escondida (sem link, fora do sitemap, `noindex`) que o `vercel.json` repassa
  para o deploy do repositório separado `kessleru/Minicurso-CI` (material do minicurso). Não tem relação com o portfólio.
- O `vercel.json` fixa `"buildCommand": "pnpm build"`: sem a pré-renderização, `/projects`,
  `/training` e `/contact` dão 404 em produção (não há mais fallback para o `index.html`).
- Metadados de cada página em `src/seo.ts` (título ≤ 60 caracteres, descrição ≤ 160). Página nova:
  adicionar em `pages` ali, a rota em `App.tsx` e o rewrite em `vercel.json`.
- Componentes precisam renderizar no build (Node, sem `window`/`document`/`localStorage`):
  acesso ao navegador só em efeitos, ou protegido com `typeof window !== 'undefined'`.
  Responsividade por CSS, não por `window.innerWidth` no render.
- Uma `<h1>` por página. Imagens com `alt`, `width` e `height`. Ícones decorativos com `aria-hidden`.
- Elementos clicáveis são `<button>`/`<a>` (ou têm `role`, `tabIndex` e teclado), com foco visível.
