import ProjectCard from '@/components/ui/Cards/ProjectCard';
import animaisBanner from '@/assets/projects/animais.webp';
import bikcraftBanner from '@/assets/projects/bikcraft.webp';
import dogsBanner from '@/assets/projects/dogs.webp';
import finapiBanner from '@/assets/projects/finapi.webp';
import forestBanner from '@/assets/projects/forest.webp';
import hackernewsBanner from '@/assets/projects/hackernews.webp';
import odinBanner from '@/assets/projects/odin.webp';
import skyatlasBanner from '@/assets/projects/skyatlas.webp';
import todoBanner from '@/assets/projects/todo.webp';
import wildbeastBanner from '@/assets/projects/wildbeast.webp';

const projects = [
  {
    title: 'FinAPI Express',
    description:
      'API financeira com Express para criação de contas, depósitos, saques, extrato e consulta de saldo.',
    img: finapiBanner,
    imgAlt: 'Banner do projeto FinAPI Express',
    stacks: ['Node.js', 'Express', 'JavaScript'],
    repoUrl: 'https://github.com/kessleru/FinAPI-Express',
  },
  {
    title: 'Sky Atlas',
    description:
      'Dashboard meteorológico global com mapa interativo, previsão do tempo e dados de qualidade do ar.',
    img: skyatlasBanner,
    imgAlt: 'Banner do projeto Sky Atlas',
    stacks: ['React', 'TypeScript', 'Tailwind CSS', 'React Leaflet'],
    repoUrl: 'https://github.com/kessleru/Sky-Atlas',
    liveUrl: 'https://sky-atlas-eight.vercel.app/',
  },
  {
    title: 'Dogs Rede Social',
    description:
      'Rede social para compartilhamento de fotos de cachorros com autenticação JWT, feed, comentários e dashboard.',
    img: dogsBanner,
    imgAlt: 'Banner do projeto Dogs Rede Social',
    stacks: ['React', 'JavaScript', 'Tailwind CSS', 'Vite'],
    repoUrl: 'https://github.com/kessleru/Dogs-Rede-Social',
    liveUrl: 'https://social-media-react-bice.vercel.app/',
  },
  {
    title: 'Forest Web',
    description:
      'Landing page para aluguel de casas e chalés em florestas, com foco em SEO e experiência visual.',
    img: forestBanner,
    imgAlt: 'Banner do projeto Forest Web',
    stacks: ['HTML', 'CSS', 'JavaScript', 'Tailwind CSS'],
    repoUrl: 'https://github.com/kessleru/Forest-Web',
    liveUrl: 'https://forest-web-six.vercel.app/',
  },
  {
    title: 'Hacker News React',
    description:
      'App em React que consome a API do Hacker News para listar notícias com título, domínio, autor e tempo relativo.',
    img: hackernewsBanner,
    imgAlt: 'Banner do projeto Hacker News React',
    stacks: ['React', 'JavaScript', 'Tailwind CSS', 'Vite'],
    repoUrl: 'https://github.com/kessleru/Hacker-News-React',
    liveUrl: 'https://hacker-news-react-one.vercel.app/',
  },
  {
    title: 'Animais Web',
    description:
      'Site interativo sobre animais com tabs, accordion, modal, dropdown e fetch de dados em JavaScript vanilla.',
    img: animaisBanner,
    imgAlt: 'Banner do projeto Animais Web',
    stacks: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/kessleru/Animais-Web',
    liveUrl: 'https://kessleru.github.io/Animais-Web/',
  },
  {
    title: 'Todo List JS',
    description:
      'Lista de tarefas minimalista com filtros, persistência em LocalStorage e tema dinâmico por horário.',
    img: todoBanner,
    imgAlt: 'Banner do projeto Todo List JS',
    stacks: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/kessleru/Todo-List-JS',
    liveUrl: 'https://kessleru.github.io/Todo-List-JS/',
  },
  {
    title: 'Bikcraft Web',
    description:
      'E-commerce de bicicletas elétricas com vanilla JS, CSS Grid e arquitetura modular. Mobile-first, acessível e otimizado para performance.',
    img: bikcraftBanner,
    imgAlt: 'Banner do projeto Bikcraft Web',
    stacks: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/kessleru/Bikcraft-Web',
    liveUrl: 'https://kessleru.github.io/Bikcraft-Web/',
  },
  {
    title: 'The Odin Library',
    description:
      'Biblioteca de livros com vanilla JS, inspirado no projeto The Odin Project.',
    img: odinBanner,
    imgAlt: 'Banner do projeto The Odin Library',
    stacks: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/kessleru/TheOdin-Library',
    liveUrl: 'https://kessleru.github.io/TheOdin-Library/',
  },
  {
    title: 'Wildbeast Web',
    description:
      'Site informativo sobre animais selvagens com design moderno. O projeto demonstra boas práticas de desenvolvimento web, design responsivo e interface intuitiva.',
    img: wildbeastBanner,
    imgAlt: 'Banner do projeto Wildbeast Web',
    stacks: ['HTML', 'CSS'],
    repoUrl: 'https://github.com/kessleru/Wildbeast-Web',
    liveUrl: 'https://kessleru.github.io/Wildbeast-Web/',
  },
];

function Projects() {
  return (
    <>
      <section>
        <div className="flex flex-wrap items-center gap-2 text-xl sm:text-2xl font-bold mb-8">
          <span className="text-ctp-accent max-sm:hidden">&gt;</span>
          <h1>Projetos</h1>
        </div>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
      </section>
    </>
  );
}

export default Projects;
