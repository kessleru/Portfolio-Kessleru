<div align="center">

<img src=".github/readme/banner.svg" alt="Portfolio Kessleru — portfólio com cara de editor de código, em quatro temas Catppuccin" width="100%">

**Meu portfólio pessoal, desenhado como uma janela de editor de código: quatro temas Catppuccin, 14 cores de destaque, heatmap de commits e vitrine de projetos.**

[![Demo](https://img.shields.io/badge/demo-ao%20vivo-a6e3a1?style=for-the-badge&logo=vercel&logoColor=black)](https://kessleru.com.br)
[![React](https://img.shields.io/github/package-json/dependency-version/kessleru/Portfolio-Kessleru/react?style=for-the-badge&logo=react&logoColor=white&color=313244)](package.json)
[![Último commit](https://img.shields.io/github/last-commit/kessleru/Portfolio-Kessleru?style=for-the-badge&color=cba6f7)](https://github.com/kessleru/Portfolio-Kessleru/commits/main)

<p><b><a href="https://kessleru.com.br">→ Abrir o portfólio</a></b></p>

<img src=".github/readme/home.png" alt="Página inicial no tema Mocha: janela de editor com caminho ~/início/, apresentação, Profile.tsx, faixa de skills, seletor de tema e heatmap de commits" width="100%">

</div>

> **Nota:** o portfólio está em construção — a página **Contato** ainda mostra um aviso de
> "em construção".

## Sobre

O site inteiro imita uma janela de editor: barra com os três botões, o caminho da página atual
(`~/início/`, `~/projetos/`) com cursor piscando, e cada bloco com uma aba de arquivo (`Profile.tsx`,
`Skills.tsx`, `Commits.tsx`). As cores vêm da paleta [Catppuccin](https://catppuccin.com): quem visita
escolhe um dos quatro sabores e uma das 14 cores de destaque, e a escolha fica salva no navegador.

## Telas

### Temas

O mesmo início nos sabores **Latte** (destaque *mauve*) e **Macchiato** (destaque *peach*). O tema
troca o atributo `data-theme` no `<html>` e o destaque troca a variável `--ctp-accent`; todo o
resto é Tailwind lendo essas variáveis.

<table>
<tr>
<td width="50%"><img src=".github/readme/latte.png" alt="Início no tema Latte, claro, com destaque roxo" width="100%"></td>
<td width="50%"><img src=".github/readme/macchiato.png" alt="Início no tema Macchiato, escuro, com destaque pêssego" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>Latte</b></sub></td>
<td align="center"><sub><b>Macchiato</b></sub></td>
</tr>
</table>

### Projetos

Cada card usa a imagem de *Open Graph* que o próprio GitHub gera para o repositório, com as tags de
stack e links para o código e a demo.

<img src=".github/readme/projetos.png" alt="Página de projetos com cards de FinAPI Express, Sky Atlas e Dogs Rede Social" width="100%">

### Formação

A formação vira um grafo do git na horizontal: a `main` começa no Ensino Médio e dela saem a
graduação (`iftm`), o PET (`pet`) e o estágio (`sae`). As linhas se desenham da esquerda para a
direita quando o grafo entra na tela, e a formatura aparece tracejada como o merge da `iftm` na
`main`. Logo abaixo, os certificados ficam num painel no estilo das Extensões do VS Code, com filtro
por competência.

<img src=".github/readme/formacao.png" alt="Página de formação: grafo horizontal com as branches main, iftm, pet e sae e o painel de certificados" width="100%">

### Celular

<table>
<tr>
<td width="50%"><img src=".github/readme/mobile.png" alt="Início no celular" width="100%"></td>
<td width="50%">

No celular o menu vira um botão que abre a navegação e fecha ao escolher uma página.

</td>
</tr>
</table>

## Funcionalidades

| | |
|---|---|
| 🎨 **4 temas × 14 destaques** | Latte, Frappé, Macchiato e Mocha; escolha salva no `localStorage` |
| 🟩 **Heatmap de commits** | Contribuições do último ano via [github-contributions-api](https://github.com/grubersjoe/github-contributions-api), com cache de 24 horas |
| 🗂️ **Vitrine de projetos** | 10 repositórios com imagem de Open Graph do GitHub, stack e links |
| ⌨️ **Editor digitando** | O `Profile.tsx` se escreve sozinho quando entra na tela, com ritmo humano, linha atual destacada, guias de indentação e colchetes coloridos; o card não muda de tamanho enquanto digita |
| 🔁 **Skills** | Ícones e nomes das tecnologias, parados (nada se mexendo sozinho enquanto se lê) |
| 🌿 **Formação em grafo** | Linha do tempo desenhada como `git log --graph`, animada com [Motion](https://motion.dev); clicar numa branch destaca o caminho dela e num commit mostra os detalhes |
| 🧩 **Certificados como extensões** | 20 certificados agrupados por emissor, filtráveis por competência, com o código da credencial para copiar |
| 🧭 **Rotas reais** | `/`, `/projects`, `/training`, `/contact` e página 404 |
| 🤖 **Kess, o mascote** | Mascote 3D que mora na página: anda pela borda dos cards, pula com gravidade conforme a leitura avança, espia da borda da tela e dorme. No celular e na versão simples ele não aparece |
| 📄 **Currículo** | Botão "Baixar CV" no início (PDF em `public/`) |
| 📖 **Versão simples** | Ícone de livro no topo troca para uma versão só texto, em uma coluna, sem cards, sem Kess e sem animação (fica salva no navegador) |
| 🔎 **SEO** | Cada página sai do build já em HTML, com título, descrição, Open Graph e dados estruturados (`ProfilePage`/`Person`), além de `sitemap.xml`, `robots.txt` e 404 de verdade |
| 🗂️ **Abas no hover** | A aba de arquivo de cada card sobe de trás dele no hover/foco; em telas de toque fica sempre visível |
| 📈 **Analytics** | [Vercel Analytics](https://vercel.com/analytics) |

## Kess, o mascote

O Kess é um Web Component (`<kess-mascot>`) em `src/lib/kess/kess.js`, usado pelo wrapper React
`src/components/kess/Kess.tsx`. O código dele (e o Three.js, via CDN) só é baixado quando um Kess aparece na tela.

```tsx
<Kess mood="triste" size="lg" />                  // emoção e tamanho
<Kess mood="normal" followAccent />               // bolinha na cor de destaque do Theme.tsx
```

No site existe um Kess só, o `KessCompanion`, inspirado em mascotes que vivem na interface (Shimeji, VS Code
Pets): ele mora na página, não na tela, então rola junto com o conteúdo. As páginas não desenham o Kess,
marcam onde ele pode ficar:

```tsx
<KessSpot mood="triste" size="clamp(88px, 11vw, 120px)" />   // o lugar dele no topo da página
<div data-kess-perch="">…</div>                              // borda onde ele pode sentar (todo Card já tem)
<footer data-kess-perch="feliz">…</footer>                   // e com qual emoção
```

- **Onde fica:** com o spot da página na tela, fica lá, no tamanho e com a emoção do spot. Fora dele, fica em
  pé na borda do card mais perto da linha de leitura e só muda de lugar quando o card sai da tela. Sem
  nenhuma borda à vista (no meio de um card longo), espia da borda de baixo da tela.
- **Como se move:** pulos balísticos com gravidade (sobe desacelerando, cai acelerando), antecipação
  (olha para onde vai e agacha), estica no ar, amassa ao pousar, levanta poeira e o card cede um pouco.
  A sombra fica no chão, não grudada nele. Se ficou para trás, entra caindo pelo topo ou pulando pela base.
- **Parado:** passeia pela borda do card, olha em volta, espia o conteúdo, dá pulinhos e, após 30 s sem
  ninguém mexer, dorme. Acompanha a rolagem com o olhar.
- **Visitante:** elementos com `data-kess-mood="animado"` (ou outra emoção) mudam a expressão no
  hover/foco, e o clique deixa ele feliz.
- **Personalidade:** boca e bochechas em cada emoção (olhos de coração, de estrela e de espiral), emotes
  (♥, z, !, ?, ♪) e poucas falas curtas e úteis em `src/components/kess/kessLines.ts`: cumprimento pela hora,
  dica ao abrir uma página, "copiado!", troca de tema, volta para a aba e quem digitar "kess". Clique, vários
  cliques (tonto) e mouse parado em cima (tímido) mudam a expressão. Qualquer parte do site pode pedir uma
  reação com `kessEvent({ say, mood, emote })`. No celular ele não aparece.
- **Acessibilidade e peso:** com "reduzir movimento" ligado, ele só troca de lugar, sem pular. O canvas é
  desenhado no tamanho em que ele aparece e cai para 30 quadros por segundo quando ele está só respirando.

O `kess.js` ganhou para isso o atributo `grounded` (sem sombra própria e sem flutuar), `pixels` (limite de
resolução) e, em JavaScript, `gaze` (direção do olhar), `crouch` (postura) e `squash()` (impulso no corpo).

## Stack

| Camada | Ferramenta |
|---|---|
| UI | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Build | [Vite](https://vite.dev) |
| Estilo | [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) e a paleta [Catppuccin](https://catppuccin.com) |
| Rotas | [React Router](https://reactrouter.com) |
| Animação | CSS, Web Animations API e [Motion](https://motion.dev) (página de formação) |
| Ícones | [Lucide](https://lucide.dev) e [React Icons](https://react-icons.github.io/react-icons/) |
| Deploy | [Vercel](https://vercel.com) |

## Rodando localmente

```bash
git clone https://github.com/kessleru/Portfolio-Kessleru.git
cd Portfolio-Kessleru
pnpm install
pnpm dev
```

O Vite sobe em `http://localhost:5173`. O heatmap e as imagens dos projetos precisam de internet.

### Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | `tsc -b` + build de produção em `dist/` + pré-renderização das páginas (`scripts/prerender.mjs`) |
| `pnpm preview` | Serve o build em `http://localhost:4173` |
| `pnpm lint` | ESLint — hoje acusa 1 erro (`react-refresh/only-export-components` em `ThemeProvider.tsx`) |

## Estrutura

```
src/
├── App.tsx                  # ThemeProvider + rotas + Header/Footer
├── main.tsx                 # navegador: BrowserRouter
├── entry-server.tsx         # build: renderiza cada rota em HTML (StaticRouter)
├── seo.ts                   # título, descrição, Open Graph e JSON-LD de cada página
├── pages/                   # Home, Projects, Training, Contact, 404
├── components/
│   ├── layout/              # Header (janela do editor) e Footer
│   ├── theme/               # ThemeProvider: sabor + destaque no localStorage
│   ├── training/            # grafo da formação, painel de certificados e os dados de ambos
│   ├── ui/                  # ProfileCard, SkillsLoop, CommitHeatmapCard, ThemeSwitcher, Cards…
│   ├── kess/                # Kess, KessCompanion (o que anda pelo site) e KessSpot
│   ├── seo/                 # RouteMeta: troca os metadados do <head> ao navegar
│   ├── simple/              # versão simples: layout, início e formação só texto
└── styles/index.css         # tokens do Catppuccin (4 sabores) e @theme do Tailwind
```

## SEO

Buscadores, redes sociais e bots de IA nem sempre rodam JavaScript, então o `pnpm build` termina com
`scripts/prerender.mjs`: ele renderiza cada rota com `src/entry-server.tsx` e grava
`dist/<rota>/index.html` já com o conteúdo da página e os metadados de [`src/seo.ts`](src/seo.ts)
(título, descrição, canônica, Open Graph, Twitter Card e JSON-LD de `ProfilePage`/`Person`). No
navegador, o React troca esse HTML pela versão interativa e o `RouteMeta` atualiza o `<head>` a cada
navegação.

- `sitemap.xml` é gerado das páginas indexáveis; `robots.txt`, ícones e `og.png` ficam em `public/`.
- Caminhos inexistentes respondem **404 de verdade** (`404.html`, com `noindex`), e não a página inicial.
- O [`vercel.json`](vercel.json) redireciona `www.kessleru.com.br` e `portfolio-kessleru.vercel.app`
  para `kessleru.com.br` (um endereço só para o Google) e tira a barra final das URLs.
- A página Contato fica com `noindex` enquanto está em construção: troque em `src/seo.ts` quando ficar pronta.
- Para refazer a imagem de compartilhamento e os ícones: `node scripts/og/gerar.cjs` (instruções no arquivo).

<details>
<summary><b>Regerando as imagens deste README</b></summary>

```bash
node .github/readme/gerar.mjs                 # banner.svg

pnpm build && pnpm preview                    # em outro terminal
pnpm add -D puppeteer-core sharp              # desfaça depois com git restore
node .github/readme/capturar.mjs              # telas em 2x, cada uma num tema
```

</details>

---

<div align="center">
<sub>Feito por <a href="https://github.com/kessleru">Otávio Kessler Ustra</a></sub>
</div>
