import { useLang } from '@/lib/i18n';
import BeachCard from '@/components/beach/BeachCard';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import CommitHeatmapCard from '@/components/ui/CommitHeatmapCard';
import { BookOpen, Download } from 'lucide-react';
import { setSimple } from '@/components/simple/simpleMode';
import KessSpot from '@/components/kess/KessSpot';

function Home() {
  const { t, lang } = useLang();
  return (
    <>
      <div className="space-y-14 sm:space-y-16">
        <section className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <KessSpot className="-my-2" />
              <div className="flex flex-wrap items-center gap-2 text-2xl font-bold sm:text-3xl">
                <h1>
                  {t('Olá! Sou o', "Hi! I'm")}{' '}
                  <span className="text-ctp-accent">Kessleru.</span>
                </h1>
              </div>
            </div>
            <div className="prose-text">
              {lang === 'en' ? (
                <>
                  <p>
                    I'm Otávio Kessler Ustra, a junior{' '}
                    <strong data-kess-mood="curioso">Full Stack</strong>{' '}
                    developer from Ituiutaba, Brazil, and a Computer Science
                    student at IFTM. I work on both front-end and back-end with
                    the <strong data-kess-mood="curioso">JavaScript</strong>{' '}
                    ecosystem: React and TypeScript for interfaces, Node.js and
                    Express for APIs.
                  </p>
                  <p>
                    I learn best by building: most of what I know came from my
                    own projects, which are on my GitHub.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Sou Otávio Kessler Ustra, desenvolvedor{' '}
                    <strong data-kess-mood="curioso">Full Stack</strong> júnior
                    em Ituiutaba, MG, e estudante de Ciência da Computação no
                    IFTM. Trabalho no front-end e no back-end com o ecossistema{' '}
                    <strong data-kess-mood="curioso">JavaScript</strong>: React
                    e TypeScript nas interfaces, Node.js e Express nas APIs.
                  </p>
                  <p>
                    Aprendo melhor fazendo: a maior parte do que sei veio de
                    projetos próprios, que estão no meu GitHub.
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="/curriculo-otavio-kessler-ustra.pdf"
                download
                data-kess-mood="animado"
                className="key key--accent accent-chip"
              >
                <Download size={16} aria-hidden="true" />
                {t('Baixar CV', 'Download CV')}
              </a>
              {/* único caminho para a versão simples (o header só tem as páginas e as redes) */}
              <button
                type="button"
                onClick={() => setSimple(true)}
                className="key"
              >
                <BookOpen size={16} aria-hidden="true" />
                {t('Versão simples', 'Simple version')}
              </button>
            </div>
          </div>
          <BeachCard />
        </section>

        <section className="grid grid-cols-1 gap-10 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <ThemeSwitcher />
          <CommitHeatmapCard />
        </section>
      </div>
    </>
  );
}

export default Home;
