import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Card from '@/components/ui/Cards/Card';

// A praia em ASCII: um vídeo em loop (renderizado com a skill ascii-diorama) e o som da praia,
// que só toca depois de um clique. O vídeo para fora da tela e quando a pessoa pede menos movimento.
const BASE = '/diorama/';
const ALT =
  'Animação em caracteres de uma praia vista de cima: um casal sentado numa canga listrada, ele de camisa branca e ela de vestido amarelo, olhando as ondas chegarem, com coqueiros e a restinga florida atrás.';

/** Ondas e vento em loop, gaivotas de vez em quando. Só começa depois de um clique (regra dos navegadores). */
function useBeachSound() {
  const [on, setOn] = useState(false);
  const ref = useRef<{
    waves: HTMLAudioElement;
    wind: HTMLAudioElement;
    gulls: HTMLAudioElement;
    timer: number;
  } | null>(null);

  useEffect(() => {
    if (!on) return;
    if (!ref.current) {
      const make = (name: string, loop: boolean, volume: number) => {
        const a = new Audio(`${BASE}som/${name}.mp3`);
        a.loop = loop;
        a.volume = volume;
        a.preload = 'auto';
        return a;
      };
      ref.current = {
        waves: make('ondas', true, 0.7),
        wind: make('vento', true, 0.45),
        gulls: make('gaivotas', false, 0.35),
        timer: 0,
      };
    }
    const s = ref.current;
    const gull = () => {
      s.gulls.currentTime = 0;
      void s.gulls.play().catch(() => {});
      s.timer = window.setTimeout(gull, 12000 + Math.random() * 14000);
    };
    void s.waves.play().catch(() => setOn(false));
    void s.wind.play().catch(() => {});
    s.timer = window.setTimeout(gull, 4000 + Math.random() * 4000);
    // com a aba escondida o som para; volta quando a pessoa retorna
    const onVisibility = () => {
      if (document.hidden) {
        s.waves.pause();
        s.wind.pause();
      } else {
        void s.waves.play().catch(() => {});
        void s.wind.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearTimeout(s.timer);
      s.waves.pause();
      s.wind.pause();
      s.gulls.pause();
    };
  }, [on]);

  return [on, setOn] as const;
}

function BeachCard() {
  const video = useRef<HTMLVideoElement>(null);
  // quem pede menos movimento começa com o vídeo parado (pode dar play); no build não há window
  const [paused, setPaused] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [sound, setSound] = useBeachSound();

  // toca só enquanto está na tela e a pessoa não pausou
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let visible = false;
    const sync = () => {
      if (visible && !paused) void el.play().catch(() => {});
      else el.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    sync();
    return () => io.disconnect();
  }, [paused]);

  return (
    <Card fileName="Praia.tsx" className="w-full">
      <div className="beach">
        <div className="beach__bar">
          <span className="beach__path">
            <span className="text-ctp-accent">~</span>/ascii/
            <span className="text-ctp-text">praia.mp4</span>
          </span>
          <span
            className="beach__status"
            data-state={paused ? 'pausado' : 'ao vivo'}
          >
            <span className="beach__dot" aria-hidden="true" />
            {paused ? 'pausado' : 'ao vivo'}
          </span>
        </div>

        <button
          type="button"
          className="beach__art"
          aria-pressed={sound}
          aria-label={sound ? 'Desligar o som da praia' : 'Ouvir a praia'}
          data-kess-mood="apaixonado"
          data-kess-say="olha eles ali"
          onClick={() => setSound((v) => !v)}
        >
          <video
            ref={video}
            className="beach__video"
            width={1200}
            height={750}
            poster={`${BASE}praia.webp`}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src={`${BASE}praia.mp4`} type="video/mp4" />
          </video>
          {!sound && (
            <span className="beach__hint" aria-hidden="true">
              <Volume2 size={13} />
              clique para ouvir
            </span>
          )}
        </button>
        <p className="sr-only">{ALT}</p>

        <div className="beach__player">
          <button
            type="button"
            className="key text-xs [--key-depth:3px] [--key-px:9px] [--key-py:5px]"
            aria-pressed={paused}
            aria-label={paused ? 'Continuar o vídeo' : 'Pausar o vídeo'}
            title={paused ? 'Continuar' : 'Pausar'}
            onClick={() => setPaused((v) => !v)}
          >
            {paused ? (
              <Play size={14} aria-hidden="true" />
            ) : (
              <Pause size={14} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="key text-xs [--key-depth:3px] [--key-px:10px] [--key-py:5px]"
            aria-pressed={sound}
            onClick={() => setSound((v) => !v)}
          >
            {sound ? (
              <Volume2 size={14} aria-hidden="true" />
            ) : (
              <VolumeX size={14} aria-hidden="true" />
            )}
            <span
              className="beach__eq"
              data-on={sound ? '' : undefined}
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="sr-only">
              {sound ? 'Desligar o som' : 'Ligar o som'}
            </span>
          </button>
        </div>
      </div>
    </Card>
  );
}

export default BeachCard;
