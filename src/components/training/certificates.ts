import type { ComponentType } from 'react';
import {
  GraduationCap,
  HandHelping,
  Presentation,
  Trophy,
  Users,
} from 'lucide-react';
import {
  SiClaude,
  SiCss3,
  SiDocker,
  SiFigma,
  SiGodotengine,
  SiHtml5,
  SiJavascript,
  SiKubernetes,
  SiNodedotjs,
  SiReact,
  SiSqlite,
  SiStreamlit,
  SiTailwindcss,
  SiTypescript,
} from 'react-icons/si';

type Icon = ComponentType<{ size?: number | string; className?: string }>;

export type Certificate = {
  id: string;
  name: string;
  issuer: 'Origamid' | 'Anthropic' | 'IFTM';
  date: string;
  credential?: string;
  /** Link de verificação quando ele não sai do código (o IFTM usa um hash à parte). */
  url?: string;
  skills: string[];
  icon: Icon;
  color: string;
  inProgress?: boolean;
};

export const issuers = ['Origamid', 'Anthropic', 'IFTM'] as const;

/** Página para conferir o certificado no site de quem emitiu. */
export function verifyUrl(certificate: Certificate) {
  const { issuer, credential, url } = certificate;
  if (url) return url;
  if (!credential) return undefined;
  if (issuer === 'Origamid')
    return `https://www.origamid.com/certificate/${credential}`;
  if (issuer === 'Anthropic')
    return `https://verify.skilljar.com/c/${credential}`;
  return undefined;
}

// Do LinkedIn, conferidos nos sites da Origamid, da Anthropic e do IFTM. Os do IFTM que estão no LinkedIn têm a data de lá (nov/2025);
// os outros vêm do sistema de certificados do IFTM, sem código nem link.
// O Front/Back End & UX/UI Design (51f018a0) é a formação de Front End que a Origamid atualizou: um certificado só.
export const certificates: Certificate[] = [
  {
    id: 'node-puro',
    name: 'Back-end com Node.js Puro',
    issuer: 'Origamid',
    date: 'em andamento',
    skills: ['Node.js', 'Back-end'],
    icon: SiNodedotjs,
    color: 'var(--ctp-green)',
    inProgress: true,
  },
  {
    id: 'react-ts',
    name: 'React com TypeScript',
    issuer: 'Origamid',
    date: 'ago/2026',
    credential: '6842971d2b',
    skills: ['React', 'TypeScript'],
    icon: SiReact,
    color: 'var(--ctp-sky)',
  },
  {
    id: 'front-back-ux',
    name: 'Front/Back End & UX/UI Design',
    issuer: 'Origamid',
    date: 'jun/2026',
    credential: '51f018a0',
    skills: ['Back-end', 'Node.js', 'Front-end', 'UX', 'UI Design'],
    icon: SiNodedotjs,
    color: 'var(--ctp-green)',
  },
  {
    id: 'ts-iniciantes',
    name: 'TypeScript para Iniciantes',
    issuer: 'Origamid',
    date: 'jun/2026',
    credential: 'faeee51e',
    skills: ['TypeScript'],
    icon: SiTypescript,
    color: 'var(--ctp-blue)',
  },
  {
    id: 'claude-code',
    name: 'Claude Code in Action',
    issuer: 'Anthropic',
    date: 'mar/2026',
    credential: 'h8fhiy8pbmx3',
    skills: ['IA'],
    icon: SiClaude,
    color: 'var(--ctp-peach)',
  },
  {
    id: 'sqlite',
    name: 'Banco de Dados SQLite',
    issuer: 'Origamid',
    date: 'fev/2026',
    credential: '0c35e971',
    skills: ['SQL', 'SQLite'],
    icon: SiSqlite,
    color: 'var(--ctp-sapphire)',
  },
  {
    id: 'ui-design',
    name: 'UI Design para Iniciantes',
    issuer: 'Origamid',
    date: 'fev/2026',
    credential: 'a420e7d4',
    skills: ['UI Design', 'Web design'],
    icon: SiFigma,
    color: 'var(--ctp-pink)',
  },
  {
    id: 'react-completo',
    name: 'React Completo',
    issuer: 'Origamid',
    date: 'jan/2026',
    credential: '212ac00b',
    skills: ['React'],
    icon: SiReact,
    color: 'var(--ctp-sky)',
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    issuer: 'Origamid',
    date: 'dez/2025',
    credential: '3a8573fb',
    skills: ['Tailwind CSS'],
    icon: SiTailwindcss,
    color: 'var(--ctp-teal)',
  },
  {
    id: 'css-grid',
    name: 'CSS Grid Layout',
    issuer: 'Origamid',
    date: 'dez/2025',
    credential: 'd88bdd4f',
    skills: ['CSS', 'CSS Grid'],
    icon: SiCss3,
    color: 'var(--ctp-sapphire)',
  },
  {
    id: 'js-es6',
    name: 'JavaScript Completo ES6',
    issuer: 'Origamid',
    date: 'dez/2025',
    credential: 'b0ae4ce5',
    skills: ['JavaScript'],
    icon: SiJavascript,
    color: 'var(--ctp-yellow)',
  },
  {
    id: 'flexbox',
    name: 'CSS Flexbox',
    issuer: 'Origamid',
    date: 'nov/2025',
    credential: 'e0c6e328',
    skills: ['HTML', 'CSS', 'Flexbox'],
    icon: SiCss3,
    color: 'var(--ctp-blue)',
  },
  {
    id: 'html-css',
    name: 'HTML e CSS para Iniciantes',
    issuer: 'Origamid',
    date: 'nov/2025',
    credential: '58323d77',
    skills: ['HTML', 'CSS', 'JavaScript'],
    icon: SiHtml5,
    color: 'var(--ctp-peach)',
  },
  {
    id: 'coxinha-2026',
    name: 'Comissão Organizadora da Maratona Coxinha++ 2026',
    issuer: 'IFTM',
    date: 'out/2026',
    skills: ['Eventos', 'Trabalho em equipe'],
    icon: Trophy,
    color: 'var(--ctp-peach)',
  },
  {
    id: 'interpet-3',
    name: 'Participante do III InterPET IFTM',
    issuer: 'IFTM',
    date: 'abr/2026',
    skills: ['Eventos'],
    icon: Users,
    color: 'var(--ctp-mauve)',
  },
  {
    id: 'mostra-ensino-5',
    name: 'Apresentação na V Mostra de Projetos de Ensino',
    issuer: 'IFTM',
    date: 'fev/2026',
    skills: ['Palestras', 'Comunicação'],
    icon: Presentation,
    color: 'var(--ctp-teal)',
  },
  {
    id: 'coxinha-2025',
    name: 'Colaborador na Comissão Organizadora do Coxinha++',
    issuer: 'IFTM',
    date: 'dez/2025',
    skills: ['Eventos', 'Trabalho em equipe'],
    icon: Trophy,
    color: 'var(--ctp-yellow)',
  },
  {
    id: 'placa-formatura',
    name: 'Colaborador na Placa de Formatura Digital dos Egressos de Informática',
    issuer: 'IFTM',
    date: 'dez/2025',
    skills: ['Trabalho em equipe'],
    icon: GraduationCap,
    color: 'var(--ctp-flamingo)',
  },
  {
    id: 'snct22-monitor',
    name: 'Monitor na 22ª Semana Nacional de Ciência e Tecnologia',
    issuer: 'IFTM',
    date: 'nov/2025',
    credential: '1376',
    url: 'https://iftm.edu.br/autenticacao/?hashCert=2f353dc7&validateCert=',
    skills: ['Comunicação', 'Trabalho em equipe'],
    icon: HandHelping,
    color: 'var(--ctp-green)',
  },
  {
    id: 'snct22-docker',
    name: 'Ministrante do Minicurso de Docker · SNCT 22',
    issuer: 'IFTM',
    date: 'nov/2025',
    credential: '1005',
    url: 'https://iftm.edu.br/autenticacao/?hashCert=2a91dac8&validateCert=',
    skills: ['Docker', 'Palestras', 'Comunicação'],
    icon: SiDocker,
    color: 'var(--ctp-blue)',
  },
  {
    id: 'snct22-kubernetes',
    name: 'Introdução ao Kubernetes · SNCT 22',
    issuer: 'IFTM',
    date: 'nov/2025',
    credential: '937',
    url: 'https://iftm.edu.br/autenticacao/?hashCert=2f88e09e&validateCert=',
    skills: ['Kubernetes'],
    icon: SiKubernetes,
    color: 'var(--ctp-sapphire)',
  },
  {
    id: 'interpet',
    name: 'Participante do II InterPET IFTM · PET Computação',
    issuer: 'IFTM',
    date: 'nov/2025',
    credential: '52',
    url: 'https://iftm.edu.br/autenticacao/?hashCert=230935d9&validateCert=',
    skills: ['Eventos'],
    icon: Users,
    color: 'var(--ctp-lavender)',
  },
  {
    id: 'snct21-streamlit',
    name: 'Criando Dashboards com Streamlit e Python · SNCT 21',
    issuer: 'IFTM',
    date: 'nov/2025',
    credential: '27556b30',
    url: 'https://iftm.edu.br/autenticacao/?hashCert=27556b30&validateCert=',
    skills: ['Python', 'Streamlit'],
    icon: SiStreamlit,
    color: 'var(--ctp-red)',
  },
  {
    id: 'snct21-godot',
    name: 'Introdução ao Desenvolvimento de Jogos em Godot · SNCT 21',
    issuer: 'IFTM',
    date: 'nov/2025',
    credential: '2244db69',
    url: 'https://iftm.edu.br/autenticacao/?hashCert=2244db69&validateCert=',
    skills: ['Godot'],
    icon: SiGodotengine,
    color: 'var(--ctp-sky)',
  },
  {
    id: 'mostra-2024',
    name: 'Colaborador na Mostra de Profissões 2024',
    issuer: 'IFTM',
    date: 'nov/2025',
    credential: '285',
    url: 'https://iftm.edu.br/autenticacao/?hashCert=261fd2b1&validateCert=',
    skills: ['Eventos'],
    icon: Presentation,
    color: 'var(--ctp-yellow)',
  },
];
