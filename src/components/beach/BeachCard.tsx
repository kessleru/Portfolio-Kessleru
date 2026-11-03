import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Card from '@/components/ui/Cards/Card';

// A praia em ASCII: um vídeo em loop (renderizado com a skill ascii-diorama) e o som da praia,
// que só toca depois de um clique. O vídeo para fora da tela e quando a pessoa pede menos movimento.
const BASE = '/diorama/';
const ALT =
  'Animação em caracteres de uma praia vista de cima: um casal sentado numa canga listrada, ele de camisa branca e ela de vestido amarelo, olhando as ondas chegarem, com coqueiros e a restinga florida atrás.';

type Sound = {
  ctx: AudioContext;
  master: GainNode;
  waves: AudioBuffer;
  wind: AudioBuffer;
  gulls: AudioBuffer;
};

let soundPromise: Promise<Sound> | null = null;

/** Carrega os três sons uma vez só, depois do primeiro clique (os navegadores exigem um gesto). */
function loadSound() {
  soundPromise ??= (async () => {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const get = async (name: string) => {
      const res = await fetch(`${BASE}som/${name}.mp3`);
      return ctx.decodeAudioData(await res.arrayBuffer());
    };
    const [waves, wind, gulls] = await Promise.all([
      get('ondas'),
      get('vento'),
      get('gaivotas'),
    ]);
    return { ctx, master, waves, wind, gulls };
  })();
  return soundPromise;
}

/** Onde o som começa e termina de fato (o MP3 pode trazer um respiro de silêncio nas pontas). */
function edges(buffer: AudioBuffer) {
  const data = buffer.getChannelData(0);
  let a = 0;
  let b = data.length - 1;
  while (a < b && Math.abs(data[a]) < 1e-4) a++;
  while (b > a && Math.abs(data[b]) < 1e-4) b--;
  return [a / buffer.sampleRate, b / buffer.sampleRate] as const;
}

/**
 * Ondas e vento em loop pelo Web Audio (a emenda do loop sai exata, sem o estalo do <audio>),
 * gaivotas de vez em quando, cada vez de um lado e num tom um pouco diferente.
 * O volume entra e sai devagar; com a aba escondida, tudo para.
 */
function useBeachSound() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!on) return;
    let alive = true;
    let timer = 0;
    const sources: AudioScheduledSourceNode[] = [];
    let sound: Sound | null = null;

    const loop = (s: Sound, buffer: AudioBuffer, volume: number) => {
      const src = s.ctx.createBufferSource();
      const gain = s.ctx.createGain();
      const [a, b] = edges(buffer);
      src.buffer = buffer;
      src.loop = true;
      src.loopStart = a;
      src.loopEnd = b;
      gain.gain.value = volume;
      src.connect(gain).connect(s.master);
      src.start(0, a);
      sources.push(src);
    };
    const gull = () => {
      if (!alive || !sound) return;
      const s = sound;
      const src = s.ctx.createBufferSource();
      const pan = s.ctx.createStereoPanner();
      const gain = s.ctx.createGain();
      src.buffer = s.gulls;
      src.playbackRate.value = 0.94 + Math.random() * 0.12;
      pan.pan.value = Math.random() * 1.2 - 0.6;
      gain.gain.value = 0.4;
      src.connect(gain).connect(pan).connect(s.master);
      src.start();
      timer = window.setTimeout(gull, 11000 + Math.random() * 15000);
    };

    loadSound()
      .then(async (s) => {
        if (!alive) return;
        sound = s;
        await s.ctx.resume();
        loop(s, s.waves, 0.85);
        loop(s, s.wind, 0.55);
        const now = s.ctx.currentTime;
        s.master.gain.cancelScheduledValues(now);
        s.master.gain.setValueAtTime(s.master.gain.value, now);
        s.master.gain.linearRampToValueAtTime(1, now + 1.4);
        timer = window.setTimeout(gull, 3500 + Math.random() * 4000);
      })
      .catch(() => setOn(false));

    const onVisibility = () => {
      if (!sound) return;
      if (document.hidden) void sound.ctx.suspend();
      else void sound.ctx.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      const s = sound;
      if (!s) return;
      const now = s.ctx.currentTime;
      s.master.gain.cancelScheduledValues(now);
      s.master.gain.setValueAtTime(s.master.gain.value, now);
      s.master.gain.linearRampToValueAtTime(0, now + 0.35);
      for (const src of sources) src.stop(now + 0.4);
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
