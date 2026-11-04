import { useLang } from '@/lib/i18n';
import { TriangleAlert } from 'lucide-react';
import KessSpot from '@/components/kess/KessSpot';

function Contact() {
  const { t } = useLang();
  return (
    <section>
      <div className="flex min-h-[55vh] flex-col items-start justify-center gap-3">
        <KessSpot mood="concentrado" size="clamp(72px, 9vw, 96px)" />

        <p className="flex items-center gap-2 text-sm font-medium text-ctp-accent">
          <TriangleAlert size={16} />
          {t('Aviso', 'Notice')}
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          {t('Em construção', 'Under construction')}
        </h1>
        <p className="prose-text">
          {t(
            'A página de contato está em desenvolvimento.',
            'The contact page is still being built.'
          )}
        </p>
      </div>
    </section>
  );
}

export default Contact;
