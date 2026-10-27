import { branches } from '@/components/training/history';
import { certificates, issuers } from '@/components/training/certificates';

// Do mais recente para o mais antigo: estágio, PET, graduação e ensino médio.
const timeline = [...branches].reverse();

function SimpleTraining() {
  return (
    <article className="space-y-14">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-ctp-text">
          Formação
        </h1>
        <p className="prose-text">
          Graduação, extensão e estágio, do mais recente ao mais antigo. Na
          versão completa, a mesma história aparece como um grafo do git.
        </p>
      </header>

      <ol className="space-y-6 border-l border-ctp-surface-1 pl-6">
        {timeline.map((branch) => (
          <li key={branch.name} className="relative">
            <span
              aria-hidden="true"
              className="absolute top-2 -left-[29px] size-2.5 rounded-full"
              style={{ backgroundColor: branch.color }}
            />
            <p className="font-medium text-ctp-text">{branch.role}</p>
            <p className="text-ctp-subtext-1">{branch.place}</p>
            <p className="mt-0.5 font-mono text-xs text-ctp-meta tabular-nums">
              {branch.period}
            </p>
          </li>
        ))}
      </ol>

      <section aria-labelledby="certificados" className="space-y-8">
        <h2 id="certificados" className="text-xl font-semibold text-ctp-text">
          Certificados
          <span className="ml-2 font-mono text-sm font-normal text-ctp-meta">
            {certificates.length}
          </span>
        </h2>
        {issuers.map((issuer) => (
          <div key={issuer} className="space-y-3">
            <h3 className="text-sm font-semibold text-ctp-subtext-1">
              {issuer}
            </h3>
            <ul className="divide-y divide-ctp-surface-0">
              {certificates
                .filter((item) => item.issuer === issuer)
                .map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <span className="text-ctp-text">{item.name}</span>
                    <span className="shrink-0 font-mono text-xs text-ctp-meta tabular-nums">
                      {item.date}
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
