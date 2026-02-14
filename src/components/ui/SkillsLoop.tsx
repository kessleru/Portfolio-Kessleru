import { LogoLoop } from '@/components/react-bits/logo-loop/LogoLoop';
import { type ComponentType, type ReactNode } from 'react';
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
import Card from './Card';

type TechLogoItem = { node: ReactNode; title: string; href: string };

type SkillsLoopProps = {
  logos: TechLogoItem[];
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
  logoHeight?: number;
  gap?: number;
  hoverSpeed?: number;
  scaleOnHover?: boolean;
  ariaLabel?: string;
};

const TypedLogoLoop = LogoLoop as unknown as ComponentType<SkillsLoopProps>;

const techLogos = [
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

function SkillsLoop() {
  return (
    <Card className="w-full text-ctp-subtext-0" fileName="Skills.tsx">
      <TypedLogoLoop
        logos={techLogos}
        speed={50}
        direction="right"
        logoHeight={30}
        gap={90}
        hoverSpeed={0}
        scaleOnHover
        ariaLabel="Technology partners"
      />
    </Card>
  );
}

export default SkillsLoop;
