<div align="center">

<img src=".github/readme/banner.svg" alt="Portfolio Kessleru — portfólio com cara de editor de código, em quatro temas Catppuccin" width="100%">

**Meu portfólio pessoal, desenhado como uma janela de editor de código: quatro temas Catppuccin, 14 cores de destaque, heatmap de commits e vitrine de projetos.**

[![Demo](https://img.shields.io/badge/demo-ao%20vivo-a6e3a1?style=for-the-badge&logo=vercel&logoColor=black)](https://portfolio-kessleru.vercel.app)
[![React](https://img.shields.io/github/package-json/dependency-version/kessleru/Portfolio-Kessleru/react?style=for-the-badge&logo=react&logoColor=white&color=313244)](package.json)
[![Último commit](https://img.shields.io/github/last-commit/kessleru/Portfolio-Kessleru?style=for-the-badge&color=cba6f7)](https://github.com/kessleru/Portfolio-Kessleru/commits/main)

<p><b><a href="https://portfolio-kessleru.vercel.app">→ Abrir o portfólio</a></b></p>

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
| ⌨️ **Efeito de digitação** | O `Profile.tsx` é "digitado" na tela (componente `TextType`, do [React Bits](https://reactbits.dev)) |
| 🔁 **Faixa de skills** | Logos das tecnologias em loop contínuo (`LogoLoop`, também do React Bits) |
| 🌿 **Formação em grafo** | Linha do tempo desenhada como `git log --graph`, animada com [Motion](https://motion.dev); clicar numa branch destaca o caminho dela e num commit mostra os detalhes |
| 🧩 **Certificados como extensões** | 20 certificados agrupados por emissor, filtráveis por competência, com o código da credencial para copiar |
| 🧭 **Rotas reais** | `/`, `/projects`, `/training`, `/contact` e página 404 |
| 🤖 **Kess, o mascote** | Mascote 3D que acompanha a rolagem pulando de card em card, fica triste na 404 e concentrado nas páginas em construção. Reage ao mouse e a bolinha segue a cor de destaque do tema |
| 📈 **Analytics** | [Vercel Analytics](https://vercel.com/analytics) |

## Kess, o mascote

O Kess é um Web Component (`<kess-mascot>`) em `src/lib/kess/kess.js`, usado pelo wrapper React
`src/components/kess/Kess.tsx`. O código dele (e o Three.js, via CDN) só é baixado quando um Kess aparece na tela.

```tsx
<Kess mood="triste" size="lg" />                  // emoção e tamanho
<Kess mood="normal" followAccent />               // bolinha na cor de destaque do Theme.tsx
```

No site existe um Kess só, o `KessCompanion`, que acompanha quem lê. As páginas não desenham o Kess:
marcam onde ele pode ficar, e ele vai pulando em arco de um lugar para outro conforme a rolagem.

```tsx
<KessSpot mood="triste" size="clamp(88px, 11vw, 120px)" />   // o lugar dele no topo da página
<div data-kess-perch="">…</div>                              // borda onde ele pode sentar (todo Card já tem)
<footer data-kess-perch="feliz">…</footer>                   // e com qual emoção
```

Com o spot da página na tela, ele fica lá, no tamanho e com a emoção do spot. Fora dele, senta na borda do
card mais perto da linha de leitura e, entre um lugar e outro, pula animado; parado, assenta com uma molinha.
Ele também reage ao visitante: qualquer elemento com `data-kess-mood="animado"` (ou outra emoção) muda a
expressão no hover/foco, o clique deixa ele feliz e, após 30 s parado, ele dorme. Com "reduzir movimento"
ligado no sistema, ele só troca de lugar, sem pular.

## Stack

| Camada | Ferramenta |
|---|---|
| UI | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Build | [Vite](https://vite.dev) |
| Estilo | [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) e a paleta [Catppuccin](https://catppuccin.com) |
| Rotas | [React Router](https://reactrouter.com) |
| Animação | [GSAP](https://gsap.com) (cursor do `TextType`) e [Motion](https://motion.dev) (página de formação) |
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
| `pnpm build` | `tsc -b` + build de produção em `dist/` |
| `pnpm preview` | Serve o build em `http://localhost:4173` |
| `pnpm lint` | ESLint — hoje acusa 1 erro (`react-refresh/only-export-components` em `ThemeProvider.tsx`) |

## Estrutura

```
src/
├── App.tsx                  # ThemeProvider + rotas + Header/Footer
├── pages/                   # Home, Projects, Training, Contact, 404
├── components/
│   ├── layout/              # Header (janela do editor) e Footer
│   ├── theme/               # ThemeProvider: sabor + destaque no localStorage
│   ├── training/            # grafo da formação, painel de certificados e os dados de ambos
│   ├── ui/                  # ProfileCard, SkillsLoop, CommitHeatmapCard, ThemeSwitcher, Cards…
│   └── react-bits/          # LogoLoop e TextType
└── styles/index.css         # tokens do Catppuccin (4 sabores) e @theme do Tailwind
```

O [`vercel.json`](vercel.json) reescreve toda rota sem extensão para o `index.html`, para que
recarregar `/projects` não dê 404.

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
