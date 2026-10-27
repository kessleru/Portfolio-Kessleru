import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import type { KessMood } from './Kess';
import { getKessEnabled, subscribeKess } from './kessPreference';
import { useSimple } from '@/components/simple/simpleMode';

type KessSpotProps = {
  mood?: KessMood;
  size?: string;
  className?: string;
};

/**
 * Lugar reservado para o Kess numa página. Não desenha nada: o KessCompanion
 * pula até aqui enquanto o espaço está na tela, no tamanho e com a emoção do spot.
 * Com o Kess desligado no Theme.tsx, o espaço some junto; no celular também (CSS .kess-only).
 */
function KessSpot({
  mood = 'normal',
  size = 'clamp(56px, 7vw, 76px)',
  className,
}: KessSpotProps) {
  const enabled = useSyncExternalStore(
    subscribeKess,
    getKessEnabled,
    () => true
  );
  const simple = useSimple();
  if (!enabled || simple) return null;

  return (
    <div
      aria-hidden="true"
      data-kess-spot={mood}
      className={cn('kess-only aspect-square shrink-0', className)}
      style={{ width: size }}
    />
  );
}

export default KessSpot;
