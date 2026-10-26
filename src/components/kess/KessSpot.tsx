import { cn } from '@/lib/utils';
import type { KessMood } from './Kess';

type KessSpotProps = {
  mood?: KessMood;
  size?: string;
  className?: string;
};

/**
 * Lugar reservado para o Kess numa página. Não desenha nada: o KessCompanion
 * pula até aqui enquanto o espaço está na tela, no tamanho e com a emoção do spot.
 */
function KessSpot({
  mood = 'normal',
  size = 'clamp(56px, 7vw, 76px)',
  className,
}: KessSpotProps) {
  return (
    <div
      aria-hidden="true"
      data-kess-spot={mood}
      className={cn('aspect-square shrink-0', className)}
      style={{ width: size }}
    />
  );
}

export default KessSpot;
