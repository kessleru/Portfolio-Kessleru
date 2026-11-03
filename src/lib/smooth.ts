import Lenis from 'lenis';

/**
 * Rolagem suave da roda do mouse e do touchpad (Lenis). O toque no celular continua nativo,
 * e quem pede menos movimento ao sistema fica com a rolagem normal do navegador.
 */
let lenis: Lenis | null = null;

export function startSmoothScroll() {
  if (typeof window === 'undefined') return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const sync = () => {
    if (!reduce.matches && !lenis) {
      lenis = new Lenis({
        autoRaf: true,
        // quanto da distância restante anda a cada quadro: 0,12 é macio sem parecer atrasado
        lerp: 0.12,
        anchors: true,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
      });
    } else if (reduce.matches && lenis) {
      lenis.destroy();
      lenis = null;
    }
  };

  sync();
  reduce.addEventListener('change', sync);
}

/** Volta ao topo pelo Lenis quando ele está ligado (senão as duas animações brigam). */
export function scrollToTop({ immediate = false } = {}) {
  if (lenis) {
    lenis.scrollTo(0, { immediate, force: true });
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: 0,
    behavior: immediate || reduce ? 'auto' : 'smooth',
  });
}
