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

// Inglês: mesmo grafo, só os textos trocam (o que não está aqui fica igual).
const branchesEn: Record<string, Partial<Branch>> = {
  main: { role: 'High school', period: '2011 → 2023' },
  iftm: {
    role: "Bachelor's in Computer Science",
    period: 'Feb 2024 → Dec 2027',
  },
  pet: { role: 'Scholarship student', period: 'Mar 2025 → now' },
  sae: {
    role: 'Computing Solutions Intern',
    place: 'Water and Sewage Authority · SAE',
    period: 'Jul 2026 → now',
  },
};

const commitsEn: Record<string, Partial<Commit>> = {
  'ensino-medio': {
    title: 'High school',
    label: 'high school',
    date: 'Dec 2023',
    body: ['ESI Santa Teresa, from 2011 to 2023.'],
  },
  bacharelado: {
    title: "Bachelor's in Computer Science",
    label: 'start',
    date: 'Feb 2024',
    body: [
      'Federal Institute of Triângulo Mineiro, Ituiutaba Campus.',
      'Expected to finish: Dec 2027.',
    ],
  },
  'periodo-2': { title: '2nd semester', label: '2nd' },
  'periodo-3': { title: '3rd semester', label: '3rd' },
  'pet-inicio': {
    title: 'PET Computação scholarship',
    date: 'Mar 2025',
    body: ['Tutorial Education Program at IFTM Ituiutaba, part-time.'],
  },
  'pet-sites': {
    title: "Websites and interfaces for the group's projects",
    label: 'websites',
  },
  'periodo-4': { title: '4th semester', label: '4th' },
  'pet-docker': {
    title: 'Docker short course at the 22nd SNCT',
    body: [
      'Taught the Docker for Beginners short course and was a monitor at the 22nd National Science and Technology Week.',
    ],
  },
  'pet-cicd': {
    title: 'CI/CD for Beginners with GitHub Actions short course',
    body: ['Instructor.'],
  },
  'periodo-5': { title: '5th semester', label: '5th' },
  'sae-inicio': {
    title: 'Internship at SAE begins',
    label: 'internship',
    date: 'Jul 2026',
    body: [
      'Computing Solutions Intern.',
      'Water and Sewage Authority of Ituiutaba.',
    ],
  },
  'periodo-6': {
    title: '6th semester',
    label: '6th',
    body: ['Current Computer Science semester.'],
  },
  'sae-automacoes': {
    title: 'Automations with spreadsheets and scripts',
    label: 'automations',
    body: ['Administrative routines for the Workplace Safety office.'],
  },
  'pet-coxinha': {
    title: 'Organized both editions of Coxinha++',
    body: [
      "IFTM's programming contest.",
      'Took part in Pizza++ and the SBC Programming Marathon.',
    ],
  },
  'sae-relatorios': {
    title: 'Reports, metrics and queries',
    label: 'reports',
    body: ['Building reports with data checks and standardization.'],
  },
  'pet-eventos': {
    title: 'Helped run more than 8 campus events',
    label: 'events',
    body: ['InterPET, Careers Fair, Teaching Projects Showcase and SNCT.'],
  },
  'sae-smarapd': {
    title: 'SmarAPD records and document scanning',
    body: ['Updating data in the Health Management system.'],
  },
  formatura: {
    title: 'Graduation in Computer Science',
    label: 'graduation',
    date: 'Dec 2027',
    body: ['Expected graduation, when iftm merges back into main.'],
  },
};

export const branchesFor = (lang: 'pt' | 'en'): Branch[] =>
  lang === 'en'
    ? branches.map((b) => ({ ...b, ...branchesEn[b.name] }))
    : branches;

export const commitsFor = (lang: 'pt' | 'en'): Commit[] =>
  lang === 'en' ? commits.map((c) => ({ ...c, ...commitsEn[c.id] })) : commits;
