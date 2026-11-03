/**
 * Cursor de seta no estilo Figma: a ponta arredondada na cor de destaque, com contorno claro
 * e uma sombra curta. É um cursor nativo (SVG), então não atrasa nem pesa: o navegador desenha.
 * Como o arquivo não lê variáveis CSS, as cores são lidas do tema e o SVG é refeito a cada troca.
 */
const PATH =
  'M3.4 2.7 20.6 9.6c.9.4.9 1.2 0 1.5l-7 2.4-2.5 7c-.3.9-1.1.9-1.5 0L2.7 3.4c-.2-.5.2-.9.7-.7Z';

function arrow(fill: string, stroke: string) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><filter id='s' x='-30%' y='-30%' width='160%' height='160%'><feDropShadow dx='0' dy='1' stdDeviation='0.9' flood-opacity='0.35'/></filter><path filter='url(#s)' d='${PATH}' fill='${fill}' stroke='${stroke}' stroke-width='1.6' stroke-linejoin='round'/></svg>`;
}

function luminance(color: string) {
  const hex = color.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

let painted = '';

/** Pinta o cursor com as cores atuais do tema (só refaz o SVG quando elas mudam). */
function paint() {
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const fill = css.getPropertyValue('--ctp-accent').trim();
  const base = css.getPropertyValue('--ctp-base').trim();
  const text = css.getPropertyValue('--ctp-text').trim();
  if (!fill || !base || !text) return;

  // contorno sempre claro, como no Figma: no Latte é o base; nos temas escuros, o text
  const stroke = luminance(base) > luminance(text) ? base : text;
  const key = `${fill}|${stroke}`;
  if (key === painted) return;
  painted = key;

  const svg = encodeURIComponent(arrow(fill, stroke));
  root.style.setProperty(
    '--cursor-arrow',
    `url("data:image/svg+xml,${svg}") 3 3, auto`
  );
  root.setAttribute('data-cursor', '');
}

/**
 * Liga o cursor e o mantém em dia: tema e destaque mudam atributos do <html>
 * (data-theme, data-simple e a variável --ctp-accent no style), então basta observar ali.
 */
export function startCursor() {
  if (typeof window === 'undefined') return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  paint();
  new MutationObserver(paint).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-simple', 'style'],
  });
}
