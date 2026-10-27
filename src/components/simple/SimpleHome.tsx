import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import { branches } from '@/components/training/history';
import SectionTitle from './SectionTitle';

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

const more = [
  {
    to: '/projects',
    title: 'Projetos',
    text: 'APIs, apps em React e sites, com o código aberto.',
  },
  {
    to: '/training',
    title: 'Formação',
    text: 'Graduação, PET, estágio e certificados.',
  },
];

function SimpleHome() {
  return (
    <article className="space-y-16">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-ctp-text sm:text-5xl">
          Otávio Kessler Ustra
        </h1>
        <p className="mt-3 text-lg">
          <span className="font-medium text-ctp-accent">
            Desenvolvedor Full Stack Júnior
          </span>
          <span className="text-ctp-subtext-0"> · Ituiutaba, MG</span>
        </p>
        <div className="prose-text mt-6">
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
          className="mt-7 inline-flex items-center gap-2 rounded-lg border border-ctp-accent/50 bg-ctp-accent/10 px-4 py-2 text-sm font-medium text-ctp-accent transition-colors hover:bg-ctp-accent/20"
        >
          <Download size={15} aria-hidden="true" />
          Baixar currículo (PDF)
        </a>
      </header>

      <section aria-labelledby="agora" className="space-y-6">
        <SectionTitle id="agora">Agora</SectionTitle>
        <ul className="space-y-5">
          {now.map((branch) => (
            <li
              key={branch.name}
              className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
            >
              <div>
                <p className="font-medium text-ctp-text">{branch.role}</p>
                <p className="text-sm text-ctp-subtext-0">{branch.place}</p>
              </div>
              <span className="shrink-0 font-mono text-xs text-ctp-meta tabular-nums">
                {branch.period}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stack" className="space-y-6">
        <SectionTitle id="stack">Tecnologias</SectionTitle>
        <ul className="flex flex-wrap gap-2">
          {stack.map((item) => (
            <li
              key={item}
              className="rounded-md border border-ctp-surface-1 px-2.5 py-1 font-mono text-xs text-ctp-subtext-1"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <nav aria-labelledby="mais" className="space-y-6">
        <SectionTitle id="mais">Mais</SectionTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          {more.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex-1 rounded-lg border border-ctp-surface-0 p-4 transition-colors hover:border-ctp-accent/60"
            >
              <span className="flex items-center justify-between font-medium text-ctp-text">
                {item.title}
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="text-ctp-subtext-0 transition-[translate,color] group-hover:translate-x-0.5 group-hover:text-ctp-accent"
                />
              </span>
              <span className="mt-1 block text-sm text-ctp-subtext-0">
                {item.text}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </article>
  );
}

export default SimpleHome;
