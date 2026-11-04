import { Link } from 'react-router-dom';
import { ArrowRight, Download, LayoutGrid } from 'lucide-react';
import { setSimple } from './simpleMode';
import { branchesFor } from '@/components/training/history';
import { useLang } from '@/lib/i18n';
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
const openNow = (lang: 'pt' | 'en') =>
  branchesFor(lang)
    .filter((branch) => branch.name !== 'main')
    .reverse();

const more = [
  {
    to: '/projects',
    title: 'Projetos',
    titleEn: 'Projects',
    text: 'APIs, apps em React e sites, com o código aberto.',
    textEn: 'APIs, React apps and websites, all open source.',
  },
  {
    to: '/training',
    title: 'Formação',
    titleEn: 'Education',
    text: 'Graduação, PET, estágio e certificados.',
    textEn: 'Degree, PET, internship and certificates.',
  },
];

function SimpleHome() {
  const { t, lang } = useLang();
  const now = openNow(lang);
  return (
    <article className="space-y-16">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-ctp-text sm:text-5xl">
          Otávio Kessler Ustra
        </h1>
        <p className="mt-3 text-lg">
          <span className="font-medium text-ctp-accent">
            {t(
              'Desenvolvedor Full Stack Júnior',
              'Junior Full Stack Developer'
            )}
          </span>
          <span className="text-ctp-subtext-0">
            {t(' · Ituiutaba, MG', ' · Ituiutaba, Brazil')}
          </span>
        </p>
        <div className="prose-text mt-6">
          <p>
            {t(
              'Sou estudante de Ciência da Computação no IFTM e trabalho no front-end e no back-end com o ecossistema JavaScript: React e TypeScript nas interfaces, Node.js e Express nas APIs.',
              "I'm a Computer Science student at IFTM and I work on both front-end and back-end with the JavaScript ecosystem: React and TypeScript for interfaces, Node.js and Express for APIs."
            )}
          </p>
          <p>
            {t(
              'Aprendo melhor fazendo: a maior parte do que sei veio de projetos próprios, que estão no meu GitHub.',
              'I learn best by building: most of what I know came from my own projects, which are on my GitHub.'
            )}
          </p>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="/curriculo-otavio-kessler-ustra.pdf"
            download
            className="key key--flat key--accent accent-chip"
          >
            <Download size={15} aria-hidden="true" />
            {t('Baixar CV', 'Download CV')}
          </a>
          <button
            type="button"
            onClick={() => setSimple(false)}
            className="key key--flat"
          >
            <LayoutGrid size={15} aria-hidden="true" />
            {t('Versão completa', 'Full version')}
          </button>
        </div>
      </header>

      <section aria-labelledby="agora" className="space-y-6">
        <SectionTitle id="agora">{t('Agora', 'Now')}</SectionTitle>
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
        <SectionTitle id="stack">
          {t('Tecnologias', 'Technologies')}
        </SectionTitle>
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
        <SectionTitle id="mais">{t('Mais', 'More')}</SectionTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          {more.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex-1 rounded-lg border border-ctp-surface-0 p-4 transition-colors hover:border-ctp-accent/60"
            >
              <span className="flex items-center justify-between font-medium text-ctp-text">
                {t(item.title, item.titleEn)}
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="text-ctp-subtext-0 transition-[translate,color] group-hover:translate-x-0.5 group-hover:text-ctp-accent"
                />
              </span>
              <span className="mt-1 block text-sm text-ctp-subtext-0">
                {t(item.text, item.textEn)}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </article>
  );
}

export default SimpleHome;
