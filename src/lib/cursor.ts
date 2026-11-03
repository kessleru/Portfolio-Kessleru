/**
 * Cursor de seta no estilo Figma: bem arredondado, na cor de destaque, com contorno branco
 * e uma sombra curta. O branco é literal, como no Figma, e não muda com o tema.
 *
 * Do jeito que os guias recomendam (MDN): PNG de 32×32 com versão 2× para telas retina
 * via image-set(), ponto de clique na ponta e um cursor do sistema de reserva. O desenho é
 * um SVG, rasterizado aqui em PNG (o Safari não aceita SVG em cursor), e refeito quando o
 * destaque muda. É um cursor nativo: não atrasa, porque quem desenha é o sistema.
 */
const SIZE = 32;
const HOTSPOT = '4 3';

// Triângulo com a traseira côncava e curva. Os cantos saem redondos do traço com
// stroke-linejoin round: o contorno branco é o mesmo caminho com traço mais grosso por baixo.
const PATH = 'M7 6 25.5 13.2 18.6 15.6Q15.9 16.5 15 19.2L12.8 26Z';

function arrow(fill: string) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${SIZE}' height='${SIZE}' viewBox='0 0 ${SIZE} ${SIZE}'><filter id='s' x='-30%' y='-30%' width='160%' height='160%'><feDropShadow dx='0' dy='1.2' stdDeviation='1.1' flood-color='black' flood-opacity='0.3'/></filter><g filter='url(#s)' stroke-linejoin='round' stroke-linecap='round'><path d='${PATH}' fill='white' stroke='white' stroke-width='8'/><path d='${PATH}' fill='${fill}' stroke='${fill}' stroke-width='3.6'/></g></svg>`;
}

async function rasterize(svg: string, scale: number) {
  const img = new Image();
  img.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE * scale;
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

/** Qual forma de image-set() o navegador entende no cursor (o Safari antigo só a com prefixo). */
function imageSetName() {
  const test = (fn: string) =>
    CSS.supports('cursor', `${fn}(url("a.png") 1x) 0 0, auto`);
  if (test('image-set')) return 'image-set';
  if (test('-webkit-image-set')) return '-webkit-image-set';
  return null;
}

let painted = '';

/** Pinta o cursor com o destaque atual (só refaz quando ele muda). */
async function paint() {
  const root = document.documentElement;
  const fill = getComputedStyle(root).getPropertyValue('--ctp-accent').trim();
  if (!fill || fill === painted) return;
  painted = fill;

  try {
    const svg = arrow(fill);
    const [x1, x2] = await Promise.all([rasterize(svg, 1), rasterize(svg, 2)]);
    if (painted !== fill) return; // o destaque mudou de novo no meio do caminho

    const set = imageSetName();
    const image = set
      ? `${set}(url("${x1}") 1x, url("${x2}") 2x)`
      : `url("${x1}")`;
    root.style.setProperty('--cursor-arrow', `${image} ${HOTSPOT}, auto`);
    root.setAttribute('data-cursor', '');
  } catch {
    // sem canvas ou sem decodificar a imagem: fica o cursor do sistema
    painted = '';
  }
}

/**
 * Liga o cursor e o mantém em dia: tema e destaque mudam atributos do <html>
 * (data-theme, data-simple e a variável --ctp-accent no style), então basta observar ali.
 */
export function startCursor() {
  if (typeof window === 'undefined') return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  paint();
  new MutationObserver(() => void paint()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-simple', 'style'],
  });
}
