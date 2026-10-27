import ProfileCard from '@/components/ui/ProfileCard';
import SkillsLoop from '@/components/ui/SkillsLoop';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import CommitHeatmapCard from '@/components/ui/CommitHeatmapCard';
import { SiGithub, SiLinkedin } from 'react-icons/si';
import { Download } from 'lucide-react';
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
              <a
                href="/curriculo-otavio-kessler-ustra.pdf"
                download
                data-kess-mood="animado"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-ctp-accent/60 bg-ctp-accent/10 px-4 py-2 text-sm font-medium text-ctp-accent transition-colors hover:bg-ctp-accent/20"
              >
                <Download size={16} aria-hidden="true" />
                Baixar CV
              </a>
              <a
                href="https://github.com/kessleru"
                target="_blank"
                rel="me noreferrer"
                data-kess-mood="animado"
                data-kess-say="os repositórios estão lá"
                className="inline-flex items-center gap-2 text-sm text-ctp-subtext-1 transition-colors hover:text-ctp-accent"
              >
                <SiGithub size={18} aria-hidden="true" />
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/otavio-ustra-8b50bb364/"
                target="_blank"
                rel="me noreferrer"
                data-kess-mood="animado"
                data-kess-say="vamos conversar?"
                className="inline-flex items-center gap-2 text-sm text-ctp-subtext-1 transition-colors hover:text-ctp-accent"
              >
                <SiLinkedin size={18} aria-hidden="true" />
                LinkedIn
              </a>
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
