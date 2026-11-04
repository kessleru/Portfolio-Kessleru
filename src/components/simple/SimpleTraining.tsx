import { branchesFor } from '@/components/training/history';
import { useLang } from '@/lib/i18n';
import {
  certificates,
  dateLabel,
  issuers,
  nameLabel,
  verifyUrl,
} from '@/components/training/certificates';
import SectionTitle from './SectionTitle';

function SimpleTraining() {
  const { t, lang } = useLang();
  // Do mais recente para o mais antigo: estágio, PET, graduação e ensino médio.
  const timeline = [...branchesFor(lang)].reverse();
  return (
    <article className="space-y-16">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-ctp-text">
          {t('Formação', 'Education')}
        </h1>
        <p className="prose-text mt-4">
          {t(
            'Graduação, extensão e estágio, do mais recente ao mais antigo. Na versão completa, a mesma história aparece como um grafo do git.',
            'Degree, extension programs and internship, from newest to oldest. In the full version, the same story is drawn as a git graph.'
          )}
        </p>
      </header>

      <section aria-labelledby="trajetoria" className="space-y-6">
        <SectionTitle id="trajetoria">{t('Trajetória', 'Path')}</SectionTitle>
        <ol className="space-y-6 border-l border-ctp-surface-1 pl-6">
          {timeline.map((branch) => (
            <li key={branch.name} className="relative">
              <span
                aria-hidden="true"
                className="absolute top-2 -left-[29px] size-2.5 rounded-full"
                style={{ backgroundColor: branch.color }}
              />
              <p className="font-medium text-ctp-text">{branch.role}</p>
              <p className="text-sm text-ctp-subtext-0">{branch.place}</p>
              <p className="mt-1 font-mono text-xs text-ctp-meta tabular-nums">
                {branch.period}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="certificados" className="space-y-8">
        <SectionTitle id="certificados">
          {`${t('Certificados', 'Certificates')} · ${certificates.length}`}
        </SectionTitle>
        {issuers.map((issuer) => (
          <div key={issuer} className="space-y-2">
            <h3 className="font-medium text-ctp-text">{issuer}</h3>
            <ul className="divide-y divide-ctp-surface-0">
              {certificates
                .filter((item) => item.issuer === issuer)
                .map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    {verifyUrl(item) ? (
                      <a
                        href={verifyUrl(item)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[15px] text-ctp-subtext-1 underline decoration-ctp-surface-2 underline-offset-4 transition-colors hover:text-ctp-text hover:decoration-ctp-accent"
                      >
                        {nameLabel(item.name, lang)}
                      </a>
                    ) : (
                      <span className="text-[15px] text-ctp-subtext-1">
                        {nameLabel(item.name, lang)}
                      </span>
                    )}
                    <span className="shrink-0 font-mono text-xs text-ctp-meta tabular-nums">
                      {dateLabel(item.date, lang)}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>
    </article>
  );
}

export default SimpleTraining;
