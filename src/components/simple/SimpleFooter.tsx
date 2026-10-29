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

// Mapa de cores da gravura, do traço mais escuro ao papel (que vira o fundo da página).
// As cores vêm de --gravura-1…5 no index.css, misturadas a partir dos tokens do Catppuccin.
const STOPS = [1, 2, 3, 4, 5].map((n) => `--gravura-${n}`);

/** Lê cada parada já resolvida pelo navegador e monta os tableValues do filtro (R, G e B). */
function tableValues(probe: HTMLElement, ctx: CanvasRenderingContext2D) {
  const channels: number[][] = [[], [], []];
  for (const name of STOPS) {
    probe.style.color = `var(${name})`;
    // o canvas converte qualquer cor (oklab, color-mix já resolvido) em sRGB
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = getComputedStyle(probe).color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    channels[0].push(r / 255);
    channels[1].push(g / 255);
    channels[2].push(b / 255);
  }
  return channels.map((c) => c.map((v) => v.toFixed(4)).join(' '));
}

/**
 * Rodapé da versão simples: logo, frase, redes, copyright e voltar ao topo, por cima do céu
 * de uma gravura que ocupa a largura toda no fim da página. No claro a gravura cinza ganha um
 * mapa de cores (filtro SVG); no escuro ela vira máscara de um fundo lavanda bem suave.
 */
function SimpleFooter() {
  const { theme } = useTheme();
  const light = theme === 'latte';
  const footerRef = useRef<HTMLElement>(null);
  const funcs = useRef<(SVGElement | null)[]>([]);

  useEffect(() => {
    const footer = footerRef.current;
    const ctx = document
      .createElement('canvas')
      .getContext('2d', { willReadFrequently: true });
    if (!light || !footer || !ctx) return;
    const probe = document.createElement('span');
    probe.hidden = true;
    footer.appendChild(probe);
    const paint = () => {
      tableValues(probe, ctx).forEach((values, i) =>
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
    return () => {
      watch.disconnect();
      probe.remove();
    };
  }, [light]);

  const toTop = () => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.getElementById('conteudo')?.focus({ preventScroll: true });
  };

  return (
    <footer ref={footerRef} className="gravura-footer">
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

      <div className="gravura-footer__content mx-auto w-full max-w-[46rem] px-5 sm:px-8">
        <p className="font-mono text-sm font-semibold text-ctp-text">
          portfolio<span className="text-ctp-accent">/kessleru</span>
        </p>
        <p className="prose-text mt-3">
          Desenvolvedor Full Stack júnior em Ituiutaba, MG. O código dos
          projetos está aberto no GitHub.
        </p>
        <ul className="mt-6 flex gap-2">
          {socials.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="me noreferrer"
                aria-label={label}
                title={label}
                className="gravura-footer__button"
              >
                <Icon size={17} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-ctp-surface-0 pt-5">
          <span className="text-sm text-ctp-subtext-0">
            © {new Date().getFullYear()} Otávio Kessler Ustra
          </span>
          <button
            type="button"
            onClick={toTop}
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
            className="gravura-footer__button cursor-pointer"
          >
            <ArrowUp size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default SimpleFooter;
