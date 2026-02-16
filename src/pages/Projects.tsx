import Header from '@/components/layout/Header';
import ProjectCard from '@/components/ui/Cards/ProjectCard';

const githubPreview = (repo: string) =>
  `https://opengraph.githubassets.com/1/kessleru/${repo}`;

const projects = [
  {
    title: 'FinAPI Express',
    description:
      'API financeira com Express para criação de contas, depósitos, saques, extrato e consulta de saldo.',
    img: githubPreview('FinAPI-express'),
    imgAlt: 'Preview do repositório FinAPI Express',
    stacks: ['Node.js', 'Express', 'JavaScript'],
    repoUrl: 'https://github.com/kessleru/FinAPI-express',
  },
  {
    title: 'Sky Atlas',
    description:
      'Dashboard meteorológico global com mapa interativo, previsão do tempo e dados de qualidade do ar.',
    img: githubPreview('Sky-Atlas'),
    imgAlt: 'Preview do repositório Sky Atlas',
    stacks: ['React', 'TypeScript', 'Tailwind CSS', 'React Leaflet'],
    repoUrl: 'https://github.com/kessleru/Sky-Atlas',
    liveUrl: 'https://sky-atlas-eight.vercel.app/',
  },
  {
    title: 'Dogs Rede Social',
    description:
      'Rede social para compartilhamento de fotos de cachorros com autenticação JWT, feed, comentários e dashboard.',
    img: githubPreview('Dogs-Rede-Social'),
    imgAlt: 'Preview do repositório Dogs Rede Social',
    stacks: ['React', 'JavaScript', 'Tailwind CSS', 'Vite'],
    repoUrl: 'https://github.com/kessleru/Dogs-Rede-Social',
    liveUrl: 'https://social-media-react-bice.vercel.app/',
  },
  {
    title: 'Forest Web',
    description:
      'Landing page para aluguel de casas e chalés em florestas, com foco em SEO e experiência visual.',
    img: githubPreview('Forest-Web'),
    imgAlt: 'Preview do repositório Forest Web',
    stacks: ['HTML', 'CSS', 'JavaScript', 'Tailwind CSS'],
    repoUrl: 'https://github.com/kessleru/Forest-Web',
    liveUrl: 'https://forest-web-six.vercel.app/',
  },
  {
    title: 'Hacker News React',
    description:
      'App em React que consome a API do Hacker News para listar notícias com título, domínio, autor e tempo relativo.',
    img: githubPreview('Hacker-News-React'),
    imgAlt: 'Preview do repositório Hacker News React',
    stacks: ['React', 'JavaScript', 'Tailwind CSS', 'Vite'],
    repoUrl: 'https://github.com/kessleru/Hacker-News-React',
    liveUrl: 'https://hacker-news-react-one.vercel.app/',
  },
  {
    title: 'Animais Web',
    description:
      'Site interativo sobre animais com tabs, accordion, modal, dropdown e fetch de dados em JavaScript vanilla.',
    img: githubPreview('Animais-Web'),
    imgAlt: 'Preview do repositório Animais Web',
    stacks: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/kessleru/Animais-Web',
    liveUrl: 'https://kessleru.github.io/Animais-Web/',
  },
  {
    title: 'Todo List JS',
    description:
      'Lista de tarefas minimalista com filtros, persistência em LocalStorage e tema dinâmico por horário.',
    img: githubPreview('Todo-List-js'),
    imgAlt: 'Preview do repositório Todo List JS',
    stacks: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/kessleru/Todo-List-js',
    liveUrl: 'https://kessleru.github.io/Todo-List-js/',
  },
  {
    title: 'Bikcraft Web',
    description:
      'E-commerce de bicicletas elétricas com vanilla JS, CSS Grid e arquitetura modular. Mobile-first, acessível e otimizado para performance.',
    img: githubPreview('Bikcraft-Web'),
    imgAlt: 'Preview do repositório Bikcraft Web',
    stacks: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/kessleru/Bikcraft-Web',
    liveUrl: 'https://kessleru.github.io/Bikcraft-Web/',
  },
  {
    title: 'The Odin Library',
    description:
      'Biblioteca de livros com vanilla JS, inspirado no projeto The Odin Project.',
    img: githubPreview('TheOdin-Library'),
    imgAlt: 'Preview do repositório The Odin Library',
    stacks: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/kessleru/TheOdin-Library',
    liveUrl: 'https://kessleru.github.io/TheOdin-Library/',
  },
  {
    title: 'Wildbeast Web',
    description:
      'Site informativo sobre animais selvagens com design moderno. O projeto demonstra boas práticas de desenvolvimento web, design responsivo e interface intuitiva.',
    img: githubPreview('Wildbeast-Web'),
    imgAlt: 'Preview do repositório Wildbeast Web',
    stacks: ['HTML', 'CSS'],
    repoUrl: 'https://github.com/kessleru/Wildbeast-Web',
    liveUrl: 'https://kessleru.github.io/Wildbeast-Web/',
  },
];

function Projects() {
  return (
    <>
      <section>
        <Header />
        <div className="flex flex-wrap items-center gap-2 text-xl sm:text-2xl font-bold mb-8">
          <span className="text-ctp-accent max-sm:hidden">&gt;</span>
          <h1>Projetos</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
      </section>
    </>
  );
}

export default Projects;
