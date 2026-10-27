import ProfileCard from '@/components/ui/ProfileCard';
import SkillsLoop from '@/components/ui/SkillsLoop';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import CommitHeatmapCard from '@/components/ui/CommitHeatmapCard';
import { BookOpen, Download } from 'lucide-react';
import { setSimple } from '@/components/simple/simpleMode';
import KessSpot from '@/components/kess/KessSpot';

function Home() {
  return (
    <>
      <div className="space-y-14 sm:space-y-16">
        <section className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:items-stretch">
          <div className="space-y-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <KessSpot className="-my-2" />
              <div className="flex flex-wrap items-center gap-2 text-2xl font-bold sm:text-3xl">
                <span className="text-ctp-accent max-sm:hidden">&gt;</span>
                <h1>
                  Olá! Sou o <span className="text-ctp-accent">Kessleru.</span>
                </h1>
              </div>
            </div>
            <div className="prose-text">
              <p>
                Sou Otávio Kessler Ustra, desenvolvedor{' '}
                <strong data-kess-mood="curioso">Full Stack</strong> júnior em
                Ituiutaba, MG, e estudante de Ciência da Computação no IFTM.
                Trabalho no front-end e no back-end com o ecossistema{' '}
                <strong data-kess-mood="curioso">JavaScript</strong>: React e
                TypeScript nas interfaces, Node.js e Express nas APIs.
              </p>
              <p>
                Aprendo melhor fazendo: a maior parte do que sei veio de
                projetos próprios, que estão no meu GitHub.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="/curriculo-otavio-kessler-ustra.pdf"
                download
                data-kess-mood="animado"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-ctp-accent/60 bg-ctp-accent/10 px-4 py-2 text-sm font-medium text-ctp-accent transition-colors hover:bg-ctp-accent/20"
              >
                <Download size={16} aria-hidden="true" />
                Baixar CV
              </a>
              {/* único caminho para a versão simples (o header só tem as páginas e as redes) */}
              <button
                type="button"
                onClick={() => setSimple(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-ctp-surface-1 px-4 py-2 text-sm font-medium text-ctp-subtext-1 transition-colors hover:border-ctp-accent/60 hover:text-ctp-accent"
              >
                <BookOpen size={16} aria-hidden="true" />
                Versão simples
              </button>
            </div>
          </div>
          <ProfileCard />
        </section>

        <SkillsLoop />

        <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ThemeSwitcher />
          <CommitHeatmapCard />
        </section>
      </div>
    </>
  );
}

export default Home;
