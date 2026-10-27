import { type ReactNode } from 'react';
import {
  SiDocker,
  SiPnpm,
  SiFigma,
  SiGit,
  SiJavascript,
  SiHtml5,
  SiCss3,
  SiNodedotjs,
  SiExpress,
  SiReact,
  SiTypescript,
  SiTailwindcss,
} from 'react-icons/si';
import Card from './Cards/Card';

type TechLogoItem = { node: ReactNode; title: string; href: string };

const techLogos: TechLogoItem[] = [
  {
    node: <SiHtml5 />,
    title: 'HTML5',
    href: 'https://developer.mozilla.org/docs/Web/HTML',
  },
  {
    node: <SiCss3 />,
    title: 'CSS3',
    href: 'https://developer.mozilla.org/docs/Web/CSS',
  },
  {
    node: <SiJavascript />,
    title: 'JavaScript',
    href: 'https://developer.mozilla.org/docs/Web/JavaScript',
  },
  {
    node: <SiTypescript />,
    title: 'TypeScript',
    href: 'https://www.typescriptlang.org',
  },
  { node: <SiReact />, title: 'React', href: 'https://react.dev' },
  {
    node: <SiTailwindcss />,
    title: 'Tailwind CSS',
    href: 'https://tailwindcss.com',
  },
  { node: <SiNodedotjs />, title: 'Node.js', href: 'https://nodejs.org' },
  { node: <SiExpress />, title: 'Express', href: 'https://expressjs.com' },
  { node: <SiDocker />, title: 'Docker', href: 'https://www.docker.com' },
  { node: <SiPnpm />, title: 'pnpm', href: 'https://pnpm.io' },
  { node: <SiGit />, title: 'Git', href: 'https://git-scm.com' },
  { node: <SiFigma />, title: 'Figma', href: 'https://www.figma.com' },
];

// Uma faixa parada, com o nome de cada tecnologia: nada se mexendo sozinho na tela enquanto a pessoa lê.
function SkillsLoop() {
  return (
    <Card className="w-full" fileName="Skills.tsx">
      <ul
        aria-label="Tecnologias que uso"
        className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-y-5 py-2"
      >
        {techLogos.map(({ node, title, href }) => (
          <li key={title}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col items-center gap-2 text-ctp-subtext-0 transition-colors hover:text-ctp-text"
            >
              <span
                aria-hidden="true"
                className="text-[26px] transition-transform duration-200 group-hover:-translate-y-0.5"
              >
                {node}
              </span>
              <span className="text-xs whitespace-nowrap text-ctp-meta transition-colors group-hover:text-ctp-subtext-1">
                {title}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default SkillsLoop;
