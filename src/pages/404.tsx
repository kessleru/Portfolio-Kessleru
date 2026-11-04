import { useLang } from '@/lib/i18n';
import { TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import KessSpot from '@/components/kess/KessSpot';

function NotFound() {
  const { t } = useLang();
  return (
    <section>
      <div className="flex min-h-[55vh] flex-col items-start justify-center gap-4">
        <KessSpot mood="triste" size="clamp(88px, 11vw, 120px)" />

        <p className="flex items-center gap-2 text-sm font-medium text-ctp-accent">
          <TriangleAlert size={16} />
          {t('Erro 404', 'Error 404')}
        </p>

        <h1 className="text-3xl font-bold sm:text-4xl">
          {t('Página não encontrada.', 'Page not found.')}
        </h1>

        <p className="prose-text">
          {t(
            'O caminho que você tentou acessar não existe ou foi movido.',
            "The page you tried to open doesn't exist or has moved."
          )}
        </p>

        <div className="mt-2 flex items-center gap-3">
          <Link to="/" className="key key--accent accent-chip">
            {t('Voltar para início', 'Back to home')}
          </Link>

          <Link
            to="/projects"
            className="text-sm text-ctp-subtext-0 transition-colors hover:text-ctp-accent"
          >
            {t('Ver projetos', 'See projects')}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NotFound;
