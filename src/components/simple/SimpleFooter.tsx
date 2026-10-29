import { useEffect, useRef, type CSSProperties } from 'react';
import { ArrowUp } from 'lucide-react';
import { SiGithub, SiLinkedin } from 'react-icons/si';
import { useTheme } from '@/components/theme/ThemeProvider';
import gravura from '@/assets/footer/gravura.webp';
import mascara from '@/assets/footer/gravura-mascara.webp';

const socials = [
  { label: 'GitHub', href: 'https://github.com/kessleru', Icon: SiGithub },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/otavio-ustra-8b50bb364/',
    Icon: SiLinkedin,
  },
];

// Mapa de cores da gravura no claro, do traço mais escuro ao papel: azul-marinho, azul, azul claro,
// areia e o próprio fundo da página (o branco do papel some nele). Cada parada mistura dois tokens.
const STOPS: [string, number, string][] = [
  ['blue', 0.2, 'text'],
  ['blue', 0.4, 'overlay-2'],
  ['lavender', 0.35, 'surface-1'],
  ['yellow', 0.25, 'base'],
  ['base', 1, 'base'],
];

type Rgb = [number, number, number];

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

function toOklab([r, g, b]: Rgb): Rgb {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.min(1, Math.max(0, toSrgb(c)))) as Rgb;
}

/** Um token do tema (#rrggbb no index.css) em RGB de 0 a 1. */
function token(name: string): Rgb | null {
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue(`--ctp-${name}`)
    .trim();
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as Rgb;
}

/**
 * Os tableValues do filtro (R, G e B), misturando os tokens em OKLab aqui mesmo: sem depender
 * de color-mix, que navegadores mais antigos não têm (lá a gravura saía com as cores puras).
 */
function tableValues() {
  const stops: Rgb[] = [];
  for (const [a, amount, b] of STOPS) {
    const ca = token(a);
    const cb = token(b);
    if (!ca || !cb) return null;
    const la = toOklab(ca);
    const lb = toOklab(cb);
    stops.push(
      fromOklab(
        [0, 1, 2].map((i) => la[i] * amount + lb[i] * (1 - amount)) as Rgb
      )
    );
  }
  return [0, 1, 2].map((c) => stops.map((s) => s[c].toFixed(4)).join(' '));
}

/**
 * Rodapé da versão simples: uma faixa curta (frase, redes, copyright e voltar ao topo) e uma gravura
 * que se dissolve no fundo: no celular embaixo do texto, na largura da coluna; no PC presa no canto
 * de baixo à direita da tela. No claro a gravura cinza ganha um
 * mapa de cores (filtro SVG); no escuro ela vira máscara de um fundo lavanda bem suave.
 */
function SimpleFooter() {
  const { theme } = useTheme();
  const light = theme === 'latte';
  const funcs = useRef<(SVGElement | null)[]>([]);

  useEffect(() => {
    if (!light) return;
    const paint = () => {
      tableValues()?.forEach((values, i) =>
        funcs.current[i]?.setAttribute('tableValues', values)
      );
    };
    paint();
    // o tema é aplicado no <html> depois deste efeito, e pode mudar a qualquer hora
    const watch = new MutationObserver(paint);
    watch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    });
    return () => watch.disconnect();
  }, [light]);

  const toTop = () => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.getElementById('conteudo')?.focus({ preventScroll: true });
  };

  return (
    <footer className="gravura-footer">
      <div className="gravura-footer__content mx-auto w-full max-w-[46rem] px-5 sm:px-8">
        {/* o fio que separa o rodapé: na largura do conteúdo e suave */}
        <div aria-hidden="true" className="h-px bg-ctp-surface-0 opacity-60" />
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pt-8">
          <div className="space-y-1">
            <p className="text-sm text-ctp-subtext-0">
              Desenvolvedor Full Stack júnior em Ituiutaba, MG.
            </p>
            <p className="font-mono text-xs text-ctp-meta tabular-nums">
              © {new Date().getFullYear()} Otávio Kessler Ustra
            </p>
          </div>
          <div className="flex items-center gap-2">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="me noreferrer"
                aria-label={label}
                title={label}
                className="gravura-footer__button"
              >
                <Icon size={16} aria-hidden="true" />
              </a>
            ))}
            <span
              aria-hidden="true"
              className="mx-1 h-5 w-px bg-ctp-surface-0"
            />
            <button
              type="button"
              onClick={toTop}
              aria-label="Voltar ao topo"
              title="Voltar ao topo"
              className="gravura-footer__button cursor-pointer"
            >
              <ArrowUp size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* no celular a gravura ocupa a coluna, embaixo do texto; no PC vai para o canto da tela */}
        {light ? (
          <>
            <svg aria-hidden="true" width="0" height="0" className="absolute">
              <filter id="gravura-mapa" colorInterpolationFilters="sRGB">
                <feColorMatrix
                  type="matrix"
                  values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
                />
                <feComponentTransfer>
                  <feFuncR
                    type="table"
                    ref={(el) => {
                      funcs.current[0] = el;
                    }}
                  />
                  <feFuncG
                    type="table"
                    ref={(el) => {
                      funcs.current[1] = el;
                    }}
                  />
                  <feFuncB
                    type="table"
                    ref={(el) => {
                      funcs.current[2] = el;
                    }}
                  />
                </feComponentTransfer>
              </filter>
            </svg>
            <img
              src={gravura}
              alt=""
              aria-hidden="true"
              width={2000}
              height={753}
              loading="lazy"
              decoding="async"
              className="gravura-footer__art"
            />
          </>
        ) : (
          <div
            aria-hidden="true"
            className="gravura-footer__art gravura-footer__art--dark"
            style={{ '--gravura-mascara': `url(${mascara})` } as CSSProperties}
          />
        )}
      </div>
    </footer>
  );
}

export default SimpleFooter;
