import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Card from '@/components/ui/Cards/Card';
import { periodOf, useNow, type Period } from '@/lib/period';

// A praia em ASCII: um vídeo em loop (renderizado com a skill ascii-diorama) e o som da praia,
// que só toca depois de um clique. O vídeo para fora da tela e quando a pessoa pede menos movimento.
const BASE = '/diorama/';
// Vídeos que já existem; um período sem o seu usa o vizinho mais parecido.
const READY: Period[] = ['tarde'];
const FALLBACK: Record<Period, Period[]> = {
  madrugada: ['madrugada', 'noite', 'tarde'],
  manha: ['manha', 'tarde'],
  tarde: ['tarde'],
  noite: ['noite', 'tarde'],
};
const videoFor = (period: Period) =>
  FALLBACK[period].find((p) => READY.includes(p)) ?? 'tarde';

// Sons de cada período: de dia vento e gaivotas; de noite fogueira e grilos.
const SOUNDS: Record<Period, { loops: [string, number][]; gulls: boolean }> = {
  manha: {
    loops: [
      ['ondas', 0.8],
      ['vento', 0.5],
    ],
    gulls: true,
  },
  tarde: {
    loops: [
      ['ondas', 0.85],
      ['vento', 0.55],
    ],
    gulls: true,
  },
  noite: {
    loops: [
      ['ondas', 0.75],
      ['fogueira', 0.6],
      ['grilos', 0.4],
    ],
    gulls: false,
  },
  madrugada: {
    loops: [
      ['ondas', 0.6],
      ['fogueira', 0.35],
      ['grilos', 0.45],
    ],
    gulls: false,
  },
};

const ALT =
  'Animação em caracteres de uma praia vista de cima: um casal sentado numa canga listrada, ele de camisa branca e ela de vestido amarelo, olhando as ondas chegarem, com coqueiros e a restinga florida atrás.';

type Sound = { ctx: AudioContext; master: GainNode };

let soundPromise: Promise<Sound> | null = null;
const buffers = new Map<string, Promise<AudioBuffer>>();

/** Cria o áudio uma vez só, depois do primeiro clique (os navegadores exigem um gesto). */
function loadSound() {
  soundPromise ??= Promise.resolve().then(() => {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    return { ctx, master };
  });
  return soundPromise;
}

function buffer(ctx: AudioContext, name: string) {
  if (!buffers.has(name))
    buffers.set(
      name,
      fetch(`${BASE}som/${name}.mp3`)
        .then((r) => r.arrayBuffer())
        .then((b) => ctx.decodeAudioData(b))
    );
  return buffers.get(name)!;
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
function useBeachSound(period: Period) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!on) return;
    let alive = true;
    let timer = 0;
    const sources: AudioScheduledSourceNode[] = [];
    let sound: Sound | null = null;

    const loop = (s: Sound, buf: AudioBuffer, volume: number) => {
      const src = s.ctx.createBufferSource();
      const gain = s.ctx.createGain();
      const [a, b] = edges(buf);
      src.buffer = buf;
      src.loop = true;
      src.loopStart = a;
      src.loopEnd = b;
      gain.gain.value = volume;
      src.connect(gain).connect(s.master);
      src.start(0, a);
      sources.push(src);
    };
    let gulls: AudioBuffer | null = null;
    const gull = () => {
      if (!alive || !sound || !gulls) return;
      const s = sound;
      const src = s.ctx.createBufferSource();
      const pan = s.ctx.createStereoPanner();
      const gain = s.ctx.createGain();
      src.buffer = gulls;
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
        const set = SOUNDS[period];
        const loaded = await Promise.all(
          set.loops.map(([n]) => buffer(s.ctx, n))
        );
        if (set.gulls) gulls = await buffer(s.ctx, 'gaivotas');
        if (!alive) return;
        loaded.forEach((b, i) => loop(s, b, set.loops[i][1]));
        const now = s.ctx.currentTime;
        s.master.gain.cancelScheduledValues(now);
        s.master.gain.setValueAtTime(s.master.gain.value, now);
        s.master.gain.linearRampToValueAtTime(1, now + 1.4);
        if (gulls) timer = window.setTimeout(gull, 3500 + Math.random() * 4000);
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
  }, [on, period]);

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
  const now = useNow();
  const period = now ? periodOf(now) : 'tarde';
  const clip = videoFor(period);
  const [sound, setSound] = useBeachSound(period);

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
  }, [paused, clip]);

  return (
    <Card fileName="Praia.tsx" className="w-full">
      <div className="beach">
        <div className="beach__bar">
          <span className="beach__path">
            <span className="text-ctp-accent">~</span>/ascii/
            <span className="text-ctp-text">praia-{period}.mp4</span>
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
            key={clip}
            ref={video}
            className="beach__video"
            width={1200}
            height={750}
            poster={`${BASE}praia-${clip}.webp`}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src={`${BASE}praia-${clip}.mp4`} type="video/mp4" />
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
