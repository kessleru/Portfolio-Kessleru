import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import { branches } from '@/components/training/history';

const stack = [
  'React',
  'TypeScript',
  'Tailwind CSS',
  'Node.js',
  'Express',
  'Prisma',
  'PostgreSQL',
  'Docker',
  'Git',
];

// O que está aberto agora, do mais recente ao mais antigo: estágio, PET e graduação.
const now = branches.filter((branch) => branch.name !== 'main').reverse();

function SimpleHome() {
  return (
    <article className="space-y-14">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-ctp-text sm:text-4xl">
          Otávio Kessler Ustra
        </h1>
        <p className="font-mono text-sm text-ctp-meta">
          Desenvolvedor Full Stack Júnior · Ituiutaba, MG
        </p>
        <div className="prose-text">
          <p>
            Sou estudante de Ciência da Computação no IFTM e trabalho no
            front-end e no back-end com o ecossistema JavaScript: React e
            TypeScript nas interfaces, Node.js e Express nas APIs.
          </p>
          <p>
            Aprendo melhor fazendo: a maior parte do que sei veio de projetos
            próprios, que estão no meu GitHub.
          </p>
        </div>
        <a
          href="/curriculo-otavio-kessler-ustra.pdf"
          download
          className="inline-flex items-center gap-2 text-sm font-medium text-ctp-text underline decoration-ctp-accent decoration-2 underline-offset-4 transition-colors hover:text-ctp-accent"
        >
          <Download size={15} aria-hidden="true" />
          Baixar currículo (PDF)
        </a>
      </header>

      <section aria-labelledby="agora" className="space-y-5">
        <h2 id="agora" className="text-lg font-semibold text-ctp-text">
          Agora
        </h2>
        <ul className="space-y-4">
          {now.map((branch) => (
            <li
              key={branch.name}
              className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
            >
              <span>
                <span className="font-medium text-ctp-text">{branch.role}</span>
                <span className="text-ctp-subtext-1"> · {branch.place}</span>
              </span>
              <span className="shrink-0 font-mono text-xs text-ctp-meta tabular-nums">
                {branch.period}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stack" className="space-y-4">
        <h2 id="stack" className="text-lg font-semibold text-ctp-text">
          Tecnologias
        </h2>
        <p className="leading-relaxed text-ctp-subtext-1">
          {stack.join(' · ')}
        </p>
      </section>

      <nav aria-label="Mais" className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
        <Link
          to="/projects"
          className="group inline-flex items-center gap-2 font-medium text-ctp-text hover:text-ctp-accent"
        >
          Ver projetos
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
        <Link
          to="/training"
          className="group inline-flex items-center gap-2 font-medium text-ctp-text hover:text-ctp-accent"
        >
          Ver formação e certificados
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </nav>
    </article>
  );
}

export default SimpleHome;
