import { useLang } from '@/lib/i18n';
import FlipClock from '@/components/ui/FlipClock';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Card from '@/components/ui/Cards/Card';
import { periodOf, useNow, type Period } from '@/lib/period';

// A praia em ASCII: um vídeo em loop (renderizado com a skill ascii-diorama) e o som da praia,
// que só toca depois de um clique. O vídeo para fora da tela e quando a pessoa pede menos movimento.
const BASE = '/diorama/';
// Vídeos que já existem; um período sem o seu usa o vizinho mais parecido.
const READY: Period[] = ['tarde', 'noite', 'manha'];
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
      ['fogueira', 1],
      ['grilos', 0.4],
    ],
    gulls: false,
  },
  madrugada: {
    loops: [
      ['ondas', 0.6],
      ['fogueira', 0.6],
      ['grilos', 0.45],
    ],
    gulls: false,
  },
};

const ALT = {
  pt: 'Animação em caracteres de uma praia vista de cima: um casal sentado numa canga listrada, ele de camisa branca e ela de vestido amarelo, olhando as ondas chegarem, com coqueiros e a restinga florida atrás.',
  en: 'Character animation of a beach seen from above: a couple sitting on a striped sarong, him in a white shirt and her in a yellow dress, watching the waves come in, with palm trees and flowering shrubs behind them.',
};

const PERIOD_EN: Record<Period, string> = {
  manha: 'morning',
  tarde: 'afternoon',
  noite: 'night',
  madrugada: 'late-night',
};

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
const VOLUME_KEY = 'praia-volume';

function readVolume() {
  try {
    const v = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(v) && v > 0 && v <= 1 ? v : 0.7;
  } catch {
    return 0.7;
  }
}

function useBeachSound(period: Period, volume: number) {
  const [on, setOn] = useState(false);
  const volumeRef = useRef(volume);

  // o controle de volume age na hora, sem reiniciar os sons
  useEffect(() => {
    volumeRef.current = volume;
    void soundPromise?.then((s) => {
      s.master.gain.setTargetAtTime(volume, s.ctx.currentTime, 0.05);
    });
  }, [volume]);

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
        s.master.gain.linearRampToValueAtTime(volumeRef.current, now + 1.4);
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
  const { t, lang } = useLang();
  const clip = videoFor(period);
  const [volume, setVolume] = useState(() =>
    typeof window === 'undefined' ? 0.7 : readVolume()
  );
  const [sound, setSound] = useBeachSound(period, volume);
  // o slider é o único controle do som: em 0 fica mudo, acima disso toca naquele volume
  const changeVolume = (v: number) => {
    if (v <= 0) {
      setSound(false);
      return;
    }
    setVolume(v);
    setSound(true);
    try {
      localStorage.setItem(VOLUME_KEY, String(v));
    } catch {
      // sem localStorage: vale só para esta visita
    }
  };
  const shown = sound ? volume : 0;

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
    <Card fileName={t('Praia.tsx', 'Beach.tsx')} className="w-full">
      <div className="beach">
        <div className="beach__bar">
          <span className="beach__path">
            <span className="text-ctp-accent">~</span>/ascii/
            <span className="text-ctp-text">
              {lang === 'en'
                ? `beach-${PERIOD_EN[period]}.mp4`
                : `praia-${period}.mp4`}
            </span>
          </span>
          <span
            className="beach__status"
            data-state={paused ? 'pausado' : 'ao vivo'}
          >
            <span className="beach__dot" aria-hidden="true" />
            {paused ? t('pausado', 'paused') : t('ao vivo', 'live')}
          </span>
        </div>

        <button
          type="button"
          className="beach__art"
          aria-pressed={sound}
          aria-label={
            sound
              ? t('Desligar o som da praia', 'Turn off the beach sound')
              : t('Ouvir a praia', 'Listen to the beach')
          }
          data-kess-mood="apaixonado"
          data-kess-say={t('olha eles ali', 'look at them there')}
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
              {t('clique para ouvir', 'click to listen')}
            </span>
          )}
        </button>
        <p className="sr-only">{ALT[lang]}</p>

        <div className="beach__player">
          <button
            type="button"
            className="key text-xs [--key-depth:3px] [--key-px:9px] [--key-py:5px]"
            aria-pressed={paused}
            aria-label={
              paused
                ? t('Continuar o vídeo', 'Play the video')
                : t('Pausar o vídeo', 'Pause the video')
            }
            title={paused ? 'Continuar' : 'Pausar'}
            onClick={() => {
              // pausar a praia também silencia o som
              if (!paused) setSound(false);
              setPaused(!paused);
            }}
          >
            {paused ? (
              <Play size={14} aria-hidden="true" />
            ) : (
              <Pause size={14} aria-hidden="true" />
            )}
          </button>
          <label className="beach__volume" data-on={sound ? '' : undefined}>
            {sound ? (
              <Volume2 size={14} aria-hidden="true" />
            ) : (
              <VolumeX size={14} aria-hidden="true" />
            )}
            <span className="sr-only">
              {t(
                'Volume do som da praia (0 é mudo)',
                'Beach sound volume (0 is mute)'
              )}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={shown}
              onChange={(e) => changeVolume(Number(e.target.value))}
              style={
                {
                  '--fill': `${Math.round(volume * 100)}%`,
                } as React.CSSProperties
              }
            />
            <span className="beach__volume-value" aria-hidden="true">
              {Math.round(shown * 100)}
            </span>
          </label>
          <FlipClock size="sm" />
        </div>
      </div>
    </Card>
  );
}

export default BeachCard;
