import ProfileCard from '@/components/ui/ProfileCard';
import SkillsLoop from '@/components/ui/SkillsLoop';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import CommitHeatmapCard from '@/components/ui/CommitHeatmapCard';
import Header from '@/components/layout/Header';
import { SiGithub, SiLinkedin } from 'react-icons/si';
import { ArrowRight } from 'lucide-react';


function Home() {
  return (
    <>
      <Header />
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <div className="space-y-6 lg:pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xl sm:text-2xl font-bold">
            <span className="text-ctp-accent max-sm:hidden">&gt;</span>
            <h1>
              Olá! Sou o <span className="text-ctp-accent">Kessleru.</span>
            </h1>
          </div>
          <div className="w-full text-balance max-w-[60ch] text-sm sm:text-base text-ctp-subtext-0">
            <p className="mb-2">
              Sou estudante de Ciência da Computação com foco em desenvolvimento
              web{' '}
              <span className="border-b-2 border-ctp-accent/80 border-dashed text-ctp-accent/80">
                Full Stack
              </span>{' '}
              utilizando o ecossistema{' '}
              <span className="border-b-2 border-ctp-accent/80 border-dashed text-ctp-accent/80">
                JavaScript
              </span>
              .
            </p>
            <p>
              Meu aprendizado é orientado a projetos práticos e cursos
              aprofundados, o que me permite consolidar conceitos por meio da
              aplicação real e do desenvolvimento de soluções funcionais.
            </p>
            <div className="mt-4 flex items-center gap-4 text-accent">
              <p className="text-ctp-accent text-sm">Conecte-se</p>
              <ArrowRight size={16} color='currentColor'/>
              <a
                href="https://github.com/kessleru"
                target="_blank"
                rel="noreferrer"
                className="transition-colors text-ctp-subtext-0 hover:text-ctp-accent"
                aria-label="GitHub"
              >
                <SiGithub size={20} />
              </a>
              <span className='text-accent'>/</span>
              <a
                href="https://www.linkedin.com/in/otavio-ustra-8b50bb364/"
                target="_blank"
                rel="noreferrer"
                className="transition-colors text-ctp-subtext-0 hover:text-ctp-accent"
                aria-label="LinkedIn"
              >
                <SiLinkedin size={20} />
              </a>
            </div>
          </div>
        </div>
        <div className='max-lg:mt-8'>
          <ProfileCard />
        </div>
        <div className="mt-8 hidden lg:col-span-2 lg:block">
          <SkillsLoop />
        </div>
        <ThemeSwitcher className="mt-8" />
        <CommitHeatmapCard className="mt-8" />
      </section>
    </>
  );
}

export default Home;
