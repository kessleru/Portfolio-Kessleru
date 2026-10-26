export type Branch = {
  name: string;
  color: string;
  role: string;
  place: string;
  period: string;
};

export type Commit = {
  id: string;
  branch: string;
  parents: string[];
  title: string;
  /** Rótulo curto desenhado embaixo (ou em cima) do nó. */
  label: string;
  /** Ano aproximado, usado só para as faixas de ano do eixo. */
  year: number;
  date?: string;
  body?: string[];
  /** Último commit de uma branch ainda aberta. */
  tip?: boolean;
  /** Ainda não aconteceu: desenhado tracejado, depois do "hoje". */
  planned?: boolean;
};

export const branches: Branch[] = [
  {
    name: 'main',
    color: 'var(--ctp-mauve)',
    role: 'Ensino Médio',
    place: 'ESI Santa Teresa',
    period: '2011 → 2023',
  },
  {
    name: 'iftm',
    color: 'var(--ctp-blue)',
    role: 'Bacharelado em Ciência da Computação',
    place: 'IFTM Campus Ituiutaba',
    period: 'fev/2024 → dez/2027',
  },
  {
    name: 'pet',
    color: 'var(--ctp-green)',
    role: 'Bolsista',
    place: 'PET Computação · IFTM Ituiutaba',
    period: 'mar/2025 → hoje',
  },
  {
    name: 'sae',
    color: 'var(--ctp-peach)',
    role: 'Estagiário de Soluções Computacionais',
    place: 'Superintendência de Água e Esgotos · SAE',
    period: 'jul/2026 → hoje',
  },
];

// Em ordem cronológica: o grafo é lido da esquerda para a direita.
export const commits: Commit[] = [
  {
    id: 'ensino-medio',
    branch: 'main',
    parents: [],
    title: 'Ensino Médio',
    label: 'ensino médio',
    year: 2023,
    date: 'dez/2023',
    body: ['ESI Santa Teresa, de 2011 a 2023.'],
  },
  {
    id: 'bacharelado',
    branch: 'iftm',
    parents: ['ensino-medio'],
    title: 'Bacharelado em Ciência da Computação',
    label: 'início',
    year: 2024,
    date: 'fev/2024',
    body: [
      'Instituto Federal do Triângulo Mineiro, Campus Ituiutaba.',
      'Previsão de conclusão: dez/2027.',
    ],
  },
  {
    id: 'periodo-2',
    branch: 'iftm',
    parents: ['bacharelado'],
    title: '2º período',
    label: '2º',
    year: 2024,
    date: '2024.2',
  },
  {
    id: 'periodo-3',
    branch: 'iftm',
    parents: ['periodo-2'],
    title: '3º período',
    label: '3º',
    year: 2025,
    date: '2025.1',
  },
  {
    id: 'pet-inicio',
    branch: 'pet',
    parents: ['periodo-3'],
    title: 'Bolsista do PET Computação',
    label: 'PET',
    year: 2025,
    date: 'mar/2025',
    body: ['Programa de Educação Tutorial do IFTM Ituiutaba, meio período.'],
  },
  {
    id: 'pet-sites',
    branch: 'pet',
    parents: ['pet-inicio'],
    title: 'Sites e interfaces para os projetos do grupo',
    label: 'sites',
    year: 2025,
  },
  {
    id: 'periodo-4',
    branch: 'iftm',
    parents: ['periodo-3'],
    title: '4º período',
    label: '4º',
    year: 2025,
    date: '2025.2',
  },
  {
    id: 'pet-docker',
    branch: 'pet',
    parents: ['pet-sites'],
    title: 'Minicurso de Docker na 22ª SNCT',
    label: 'Docker',
    year: 2025,
    date: '2025',
    body: [
      'Ministrante do minicurso Docker para Iniciantes e monitor da 22ª Semana Nacional de Ciência e Tecnologia.',
    ],
  },
  {
    id: 'pet-cicd',
    branch: 'pet',
    parents: ['pet-docker'],
    title: 'Minicurso CI/CD para Iniciantes com GitHub Actions',
    label: 'CI/CD',
    year: 2025,
    body: ['Ministrante.'],
  },
  {
    id: 'periodo-5',
    branch: 'iftm',
    parents: ['periodo-4'],
    title: '5º período',
    label: '5º',
    year: 2026,
    date: '2026.1',
  },
  {
    id: 'sae-inicio',
    branch: 'sae',
    parents: ['ensino-medio'],
    title: 'Início do estágio na SAE',
    label: 'estágio',
    year: 2026,
    date: 'jul/2026',
    body: [
      'Estagiário de Soluções Computacionais.',
      'Superintendência de Água e Esgotos de Ituiutaba.',
    ],
  },
  {
    id: 'periodo-6',
    branch: 'iftm',
    parents: ['periodo-5'],
    title: '6º período',
    label: '6º',
    year: 2026,
    date: '2026.2',
    body: ['Período atual de Ciência da Computação.'],
    tip: true,
  },
  {
    id: 'sae-automacoes',
    branch: 'sae',
    parents: ['sae-inicio'],
    title: 'Automações com planilhas e scripts',
    label: 'automações',
    year: 2026,
    body: ['Rotinas administrativas do Anexo de Segurança do Trabalho.'],
  },
  {
    id: 'pet-coxinha',
    branch: 'pet',
    parents: ['pet-cicd'],
    title: 'Organização das duas edições da Coxinha++',
    label: 'Coxinha++',
    year: 2026,
    body: [
      'Maratona de programação do IFTM.',
      'Participação na Pizza++ e na Maratona SBC.',
    ],
  },
  {
    id: 'sae-relatorios',
    branch: 'sae',
    parents: ['sae-automacoes'],
    title: 'Relatórios, indicadores e consultas',
    label: 'relatórios',
    year: 2026,
    body: ['Montagem de relatórios com conferência e padronização dos dados.'],
  },
  {
    id: 'pet-eventos',
    branch: 'pet',
    parents: ['pet-coxinha'],
    title: 'Apoio em mais de 8 eventos do campus',
    label: 'eventos',
    tip: true,
    year: 2026,
    body: [
      'InterPET, Mostra de Profissões, Mostra de Projetos de Ensino e SNCT.',
    ],
  },
  {
    id: 'sae-smarapd',
    branch: 'sae',
    parents: ['sae-relatorios'],
    title: 'Registros no SmarAPD e digitalização de documentos',
    label: 'SmarAPD',
    year: 2026,
    body: ['Atualização de dados no sistema de Gestão de Saúde.'],
    tip: true,
  },
  {
    id: 'formatura',
    branch: 'main',
    parents: ['ensino-medio', 'periodo-6'],
    title: 'Formatura em Ciência da Computação',
    label: 'formatura',
    year: 2027,
    date: 'dez/2027',
    body: ['Previsão de conclusão, quando a iftm volta para a main.'],
    planned: true,
  },
];
