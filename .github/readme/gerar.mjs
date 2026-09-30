/**
 * Gera as imagens vetoriais do README: o banner e os cartões de terminal.
 *
 * Rodar:  node .github/readme/gerar.mjs
 *
 * Sem dependências. Todo texto de terminal nas cenas lá embaixo é cópia de uma
 * execução real — se a saída mudar, cole a nova e rode de novo.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SAIDA = import.meta.dirname;

const FONTE_UI = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const FONTE_MONO =
  "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace,'Noto Color Emoji','Apple Color Emoji','Segoe UI Emoji'";

const escapar = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------------
// Terminal: saída real com códigos ANSI → SVG
// ---------------------------------------------------------------------

const CORES_ANSI = {
  31: '#ff7b72', // vermelho
  32: '#7ee787', // verde
  33: '#f2cc60', // amarelo
  34: '#79c0ff', // azul
  35: '#d2a8ff', // magenta
  36: '#a5d6ff', // ciano
  37: '#c9d1d9',
  90: '#7d8590', // cinza
  97: '#f0f6fc',
};

/** Quebra uma linha com códigos ANSI em trechos `{ texto, cor, negrito }`. */
function lerAnsi(linha) {
  const trechos = [];
  let cor = null;
  let negrito = false;
  let resto = linha;
  const RE = /\x1b\[([0-9;]*)m/;
  let m;
  while ((m = RE.exec(resto)) !== null) {
    if (m.index > 0) trechos.push({ texto: resto.slice(0, m.index), cor, negrito });
    for (const codigo of m[1].split(';').map(Number)) {
      if (codigo === 0) ((cor = null), (negrito = false));
      else if (codigo === 1) negrito = true;
      else if (codigo === 22) negrito = false;
      else if (codigo === 39) cor = null;
      else if (CORES_ANSI[codigo]) cor = CORES_ANSI[codigo];
    }
    resto = resto.slice(m.index + m[0].length);
  }
  if (resto) trechos.push({ texto: resto, cor, negrito });
  return trechos.length ? trechos : [{ texto: '', cor: null, negrito: false }];
}

const comprimento = (linha) => lerAnsi(linha).reduce((n, t) => n + t.texto.length, 0);

function linhasSvg(linhas, { x, y0, alturaLinha }) {
  return linhas
    .map((linha, i) => {
      const spans = lerAnsi(linha)
        .map(
          (t) =>
            `<tspan${t.cor ? ` fill="${t.cor}"` : ''}${t.negrito ? ' font-weight="600"' : ''}>${escapar(t.texto)}</tspan>`,
        )
        .join('');
      return `    <text x="${x}" y="${y0 + i * alturaLinha}" xml:space="preserve">${spans}</text>`;
    })
    .join('\n');
}

/** Cartão de terminal com fundo escuro fixo: funciona nos dois temas do GitHub. */
function terminal({ titulo, linhas, arquivo, colunas }) {
  const FONTE = 13;
  const LARGURA_CHAR = FONTE * 0.6; // métrica de fonte monoespaçada
  const ALTURA_LINHA = 20;
  const PADDING = 18;
  const BARRA = 34;
  const ZONA_BOTOES = 82; // o título não pode passar por cima das bolinhas
  const MARGEM_CANTO = 24;

  const cols = colunas ?? Math.max(...linhas.map(comprimento));
  const larguraMinima = ZONA_BOTOES + titulo.length * 12 * 0.6 + MARGEM_CANTO;
  const largura = Math.ceil(Math.max(cols * LARGURA_CHAR + PADDING * 2, larguraMinima));
  const altura = BARRA + PADDING + linhas.length * ALTURA_LINHA + PADDING;
  const xTitulo = ZONA_BOTOES + (largura - ZONA_BOTOES - MARGEM_CANTO) / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" role="img" aria-label="${escapar(titulo)}">
  <rect width="${largura}" height="${altura}" rx="10" fill="#0d1117" stroke="#30363d"/>
  <path d="M0 10a10 10 0 0 1 10-10h${largura - 20}a10 10 0 0 1 10 10v${BARRA - 10}H0z" fill="#161b22"/>
  <line x1="0" y1="${BARRA}" x2="${largura}" y2="${BARRA}" stroke="#30363d"/>
  <circle cx="18" cy="17" r="5" fill="#ff5f57"/>
  <circle cx="36" cy="17" r="5" fill="#febc2e"/>
  <circle cx="54" cy="17" r="5" fill="#28c840"/>
  <text x="${xTitulo}" y="22" text-anchor="middle" font-family="${FONTE_MONO}" font-size="12" fill="#7d8590">${escapar(titulo)}</text>
  <g font-family="${FONTE_MONO}" font-size="${FONTE}" fill="#c9d1d9">
${linhasSvg(linhas, { x: PADDING, y0: BARRA + PADDING + ALTURA_LINHA - 6, alturaLinha: ALTURA_LINHA })}
  </g>
</svg>
`;
  writeFileSync(join(SAIDA, arquivo), svg);
  console.log(`✓ ${arquivo}  (${largura}×${altura})`);
}

// ---------------------------------------------------------------------
// Banner 1200×380: identidade à esquerda, "o que o projeto faz" à direita
// ---------------------------------------------------------------------

/**
 * Conteúdo pronto para o card do banner: um terminal em miniatura.
 * Coordenadas relativas ao card (428×252).
 */
function cardTerminal({ titulo, linhas, fonte: fonteMax = 13 }) {
  // Cabe no card: a fonte encolhe para a linha mais longa e a altura da linha
  // para o número de linhas, em vez de o texto vazar pela borda.
  const maisLonga = Math.max(...linhas.map(comprimento));
  const fonte = Math.min(fonteMax, 388 / (maisLonga * 0.6));
  const alturaLinha = Math.min(fonte * 1.55, 196 / linhas.length);
  if (fonte < 10.5 || alturaLinha < fonte * 1.2) console.warn(`! card "${titulo}" apertado: fonte ${fonte.toFixed(1)}`);
  return `
    <rect width="428" height="252" rx="18" fill="#0d1117"/>
    <path d="M0 18a18 18 0 0 1 18-18h392a18 18 0 0 1 18 18v12H0z" fill="#161b22"/>
    <circle cx="22" cy="16" r="4.5" fill="#ff5f57"/><circle cx="38" cy="16" r="4.5" fill="#febc2e"/><circle cx="54" cy="16" r="4.5" fill="#28c840"/>
    <text x="241" y="20" text-anchor="middle" font-family="${FONTE_MONO}" font-size="11" fill="#7d8590">${escapar(titulo)}</text>
    <g font-family="${FONTE_MONO}" font-size="${+fonte.toFixed(2)}" fill="#c9d1d9">
${linhasSvg(linhas, { x: 20, y0: +(44 + alturaLinha * 0.75).toFixed(1), alturaLinha: +alturaLinha.toFixed(2) })}
    </g>`;
}

function banner({ arquivo, titulo, tagline, stack, pills = [], cores, card, arte = '', defs = '', circulos = true, rotulo }) {
  const { de, ate, texto = '#ffffff', suave = 'rgba(255,255,255,.78)', circulo = '#ffffff', circuloOpacidade = 0.08 } = cores;
  const tamanhoTitulo = titulo.length > 16 ? 44 : 52;

  // A coluna da esquerda tem ~600px úteis; avisa antes de o texto invadir o card.
  const largo = [
    [titulo, tamanhoTitulo * 0.58],
    [tagline, 24 * 0.52],
    [stack, 17 * 0.5],
  ].find(([t, k]) => t.length * k > 600);
  if (largo) console.warn(`! texto largo demais para o banner: "${largo[0]}"`);

  let x = 74;
  const pillsSvg = pills
    .map((p) => {
      const largura = Math.round(p.texto.length * 14 * 0.58 + 46);
      const s = `<rect x="${x}" y="262" width="${largura}" height="32" rx="16" fill="${p.fundo}"/>
    <circle cx="${x + 20}" cy="278" r="4" fill="${p.cor}"/><text x="${x + 32}" y="283" fill="${p.cor}">${escapar(p.texto)}</text>`;
      x += largura + 10;
      return s;
    })
    .join('\n    ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="380" viewBox="0 0 1200 380" role="img" aria-label="${escapar(rotulo ?? `${titulo} — ${tagline}`)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${de}"/>
      <stop offset="100%" stop-color="${ate}"/>
    </linearGradient>
    <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity=".28"/>
    </filter>
    <clipPath id="recorte"><rect width="428" height="252" rx="18"/></clipPath>
    <clipPath id="moldura"><rect width="1200" height="380" rx="24"/></clipPath>${defs}
  </defs>

  <rect width="1200" height="380" rx="24" fill="url(#bg)"/>
${circulos ? `  <circle cx="1105" cy="60" r="190" fill="${circulo}" opacity="${circuloOpacidade}"/>
  <circle cx="110" cy="360" r="150" fill="${circulo}" opacity="${circuloOpacidade * 0.8}"/>` : ''}
  <g clip-path="url(#moldura)">${arte}
  </g>

  <text x="72" y="148" font-family="${FONTE_UI}" font-size="${tamanhoTitulo}" font-weight="800" letter-spacing="-1" fill="${texto}">${escapar(titulo)}</text>
  <text x="74" y="196" font-family="${FONTE_UI}" font-size="24" font-weight="600" fill="${texto}">${escapar(tagline)}</text>
  <text x="74" y="232" font-family="${FONTE_UI}" font-size="17" fill="${suave}">${escapar(stack)}</text>

  <g font-family="${FONTE_UI}" font-size="14" font-weight="600">
    ${pillsSvg}
  </g>

${card ? `  <g transform="translate(700,64)">
    <rect width="428" height="252" rx="18" fill="${card.fundo ?? '#ffffff'}" filter="url(#sombra)"/>
    <g clip-path="url(#recorte)">${card.conteudo}
    </g>
  </g>` : ''}
</svg>
`;
  writeFileSync(join(SAIDA, arquivo), svg);
  console.log(`✓ ${arquivo}  (1200×380)`);
}

/**
 * Embute um SVG do próprio repositório (logo, ícone) dentro do banner, na
 * caixa x/y/largura/altura. Ids ganham prefixo para não colidirem entre si.
 * `trocar` substitui cores literais (ex.: { white: '#1a1a1a' }).
 */
function svgArquivo(caminho, { x, y, largura, altura, trocar = {}, extra = '' }) {
  let bruto = readFileSync(join(SAIDA, '..', '..', caminho), 'utf8')
    .replace(/<\?xml[^>]*>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const raiz = bruto.match(/<svg[ >][^>]*>/)[0];
  const viewBox =
    (raiz.match(/viewBox="([^"]+)"/) ?? [])[1] ??
    `0 0 ${parseFloat(raiz.match(/width="([^"]+)"/)[1])} ${parseFloat(raiz.match(/height="([^"]+)"/)[1])}`;
  const prefixo = caminho.replace(/[^a-z0-9]/gi, '');
  let miolo = bruto.slice(bruto.indexOf(raiz) + raiz.length, bruto.lastIndexOf('</svg>'));
  miolo = miolo
    .replace(/id="([^"]+)"/g, `id="${prefixo}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefixo}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefixo}-$1"`);
  for (const [de, para] of Object.entries(trocar)) miolo = miolo.split(`"${de}"`).join(`"${para}"`);
  return `<svg x="${x}" y="${y}" width="${largura}" height="${altura}" viewBox="${viewBox}" ${extra}>${miolo.trim()}</svg>`;
}

// Atalhos ANSI para escrever as cenas
const v = '\x1b[32m';
const am = '\x1b[33m';
const vm = '\x1b[31m';
const az = '\x1b[34m';
const c = '\x1b[36m';
const mg = '\x1b[35m';
const f = '\x1b[90m';
const b = '\x1b[1m';
const _ = '\x1b[0m';

// ---------------------------------------------------------------------
// Cenas
// ---------------------------------------------------------------------
// Arte: os quatro sabores do Catppuccin que o ThemeProvider troca, cada um
// como a janela "de editor" do site, e as 14 cores de destaque da paleta.
const sabores = [
  { nome: 'Latte', base: '#eff1f5', manto: '#e6e9ef', texto: '#4c4f69', sub: '#9ca0b0', destaque: '#8839ef' },
  { nome: 'Frappé', base: '#303446', manto: '#292c3c', texto: '#c6d0f5', sub: '#737994', destaque: '#ef9f76' },
  { nome: 'Macchiato', base: '#24273a', manto: '#1e2030', texto: '#cad3f5', sub: '#6e738d', destaque: '#8aadf4' },
  { nome: 'Mocha', base: '#1e1e2e', manto: '#181825', texto: '#cdd6f4', sub: '#6c7086', destaque: '#a6e3a1' },
];
const destaques = ['#f5e0dc', '#f2cdcd', '#f5c2e7', '#cba6f7', '#f38ba8', '#eba0ac', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5', '#89dceb', '#74c7ec', '#89b4fa', '#b4befe'];
const mono = 'ui-monospace,Consolas,monospace';

const janela = (s, i) => {
  const x = 700 + i * 44;
  const y = 30 + i * 44;
  return `
  <g transform="translate(${x},${y})" filter="url(#sombra)">
    <rect width="300" height="170" rx="12" fill="${s.base}" stroke="${s.sub}" stroke-opacity=".35"/>
    <path d="M0 12a12 12 0 0 1 12-12h276a12 12 0 0 1 12 12v44H0z" fill="${s.manto}"/>
    <circle cx="16" cy="14" r="4" fill="#f38ba8"/><circle cx="30" cy="14" r="4" fill="#f9e2af"/><circle cx="44" cy="14" r="4" fill="#a6e3a1"/>
    <text x="150" y="18" text-anchor="middle" font-family="${mono}" font-size="9" fill="${s.sub}">Portfolio — ${s.nome}</text>
    <text x="14" y="44" font-family="${mono}" font-size="13" fill="${s.destaque}">~/início/<tspan fill="${s.destaque}">▌</tspan></text>
    <g font-family="${mono}" font-size="12">
      <text x="14" y="80" fill="${s.destaque}">&gt; <tspan fill="${s.texto}">Olá! Sou o</tspan> Kessleru.</text>
      <text x="14" y="104" fill="${s.texto}">const <tspan fill="${s.texto}">pessoa</tspan> = {</text>
      <text x="30" y="122" fill="${s.texto}">tema: <tspan fill="${s.destaque}">'${s.nome.toLowerCase()}'</tspan>,</text>
      <text x="14" y="140" fill="${s.texto}">};</text>
    </g>
  </g>`;
};

banner({
  arquivo: 'banner.svg',
  titulo: 'Portfolio Kessleru',
  tagline: 'Portfólio com cara de editor de código',
  stack: 'React · TypeScript · Vite · Tailwind v4 · shadcn/ui',
  cores: { de: '#11111b', ate: '#313244', texto: '#cdd6f4', suave: '#a6adc8', circulo: '#a6e3a1', circuloOpacidade: 0.06 },
  pills: [
    { texto: '4 temas', fundo: 'rgba(166,227,161,.14)', cor: '#a6e3a1' },
    { texto: '14 destaques', fundo: 'rgba(203,166,247,.16)', cor: '#cba6f7' },
    { texto: 'Heatmap de commits', fundo: 'rgba(137,180,250,.16)', cor: '#89b4fa' },
  ],
  arte: `
  ${sabores.map(janela).join('')}
  <g transform="translate(74,330)">
    ${destaques.map((cor, i) => `<circle cx="${i * 22}" cy="0" r="7" fill="${cor}"/>`).join('')}
  </g>`,
});
