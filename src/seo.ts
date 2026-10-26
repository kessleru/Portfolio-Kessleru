// Metadados de cada página: usados no build (HTML pré-renderizado que buscadores e redes sociais leem)
// e no navegador (título da aba ao trocar de página). Mudou algo aqui, mudou nos dois.

export const SITE_URL = 'https://kessleru.com.br';
export const SITE_NAME = 'Kessleru';
export const OG_IMAGE = `${SITE_URL}/og.png`;

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const GITHUB = 'https://github.com/kessleru';
const LINKEDIN = 'https://www.linkedin.com/in/otavio-ustra-8b50bb364/';

export type PageMeta = {
  path: string;
  /** Nome curto da página, usado na trilha (breadcrumb). */
  name: string;
  title: string;
  description: string;
  /** Páginas fora do índice: 404 e o que ainda está em construção. */
  noindex?: boolean;
};

export const pages: PageMeta[] = [
  {
    path: '/',
    name: 'Início',
    title: 'Dev Full Stack Júnior em Ituiutaba-MG · Otávio Kessler Ustra',
    description:
      'Otávio Kessler Ustra (kessleru), programador Full Stack júnior em Ituiutaba-MG: front-end com React e TypeScript, back-end com Node.js, Express e APIs REST.',
  },
  {
    path: '/projects',
    name: 'Projetos',
    title: 'Projetos de front-end e back-end · Otávio Kessler Ustra',
    description:
      'Projetos de Otávio Kessler Ustra, dev Full Stack júnior: APIs com Node.js e Express, aplicações em React e TypeScript e sites responsivos, com código aberto.',
  },
  {
    path: '/training',
    name: 'Formação',
    title: 'Formação e certificados · Otávio Kessler Ustra',
    description:
      'Formação de Otávio Kessler Ustra: Ciência da Computação no IFTM Ituiutaba, PET Computação, estágio na SAE e certificados em JavaScript, React, Node.js e mais.',
  },
  {
    path: '/contact',
    name: 'Contato',
    title: 'Contato · Otávio Kessler Ustra, Dev Full Stack Júnior',
    description:
      'Fale com Otávio Kessler Ustra, desenvolvedor Full Stack júnior em Ituiutaba-MG, sobre vagas, estágios e projetos de front-end e back-end.',
    // Volta para o índice quando a página de contato tiver conteúdo.
    noindex: true,
  },
];

export const notFoundPage: PageMeta = {
  path: '/404',
  name: 'Página não encontrada',
  title: 'Página não encontrada · Otávio Kessler Ustra',
  description: 'O caminho que você tentou acessar não existe ou foi movido.',
  noindex: true,
};

export function pageFor(pathname: string) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return pages.find((page) => page.path === path) ?? notFoundPage;
}

export const canonicalUrl = (page: PageMeta) =>
  page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`;

const person = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Otávio Kessler Ustra',
  givenName: 'Otávio',
  familyName: 'Kessler Ustra',
  alternateName: ['kessleru', 'Kessleru'],
  url: `${SITE_URL}/`,
  image: 'https://avatars.githubusercontent.com/u/90390195?s=460',
  jobTitle: 'Desenvolvedor Full Stack Júnior',
  description:
    'Desenvolvedor Full Stack júnior e estudante de Ciência da Computação no IFTM, em Ituiutaba-MG. Trabalha com front-end (React, TypeScript) e back-end (Node.js, Express).',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Ituiutaba',
    addressRegion: 'MG',
    addressCountry: 'BR',
  },
  affiliation: [
    {
      '@type': 'CollegeOrUniversity',
      name: 'Instituto Federal do Triângulo Mineiro (IFTM), Campus Ituiutaba',
      url: 'https://iftm.edu.br/ituiutaba/',
    },
    {
      '@type': 'Organization',
      name: 'PET Computação IFTM Ituiutaba',
    },
  ],
  hasOccupation: {
    '@type': 'Occupation',
    name: 'Desenvolvedor Full Stack Júnior',
    occupationLocation: {
      '@type': 'City',
      name: 'Ituiutaba, MG',
    },
    skills:
      'Front-end, Back-end, JavaScript, TypeScript, React, Node.js, Express, APIs REST, Tailwind CSS, Docker, Git',
  },
  knowsAbout: [
    'Desenvolvimento Full Stack',
    'Front-end',
    'Back-end',
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Express',
    'APIs REST',
    'HTML',
    'CSS',
    'Tailwind CSS',
    'Docker',
    'Git',
  ],
  knowsLanguage: 'pt-BR',
  sameAs: [GITHUB, LINKEDIN],
};

const website = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  alternateName: ['Otávio Kessler Ustra', 'kessleru.com.br'],
  inLanguage: 'pt-BR',
  publisher: { '@id': PERSON_ID },
};

/** Dados estruturados (schema.org) da página, no formato que o Google lê. */
export function structuredData(page: PageMeta) {
  const url = canonicalUrl(page);

  if (page.path === '/') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        website,
        {
          '@type': 'ProfilePage',
          '@id': `${url}#profilepage`,
          url,
          name: page.title,
          description: page.description,
          inLanguage: 'pt-BR',
          isPartOf: { '@id': WEBSITE_ID },
          mainEntity: { '@id': PERSON_ID },
        },
        person,
      ],
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': page.path === '/projects' ? 'CollectionPage' : 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: page.title,
        description: page.description,
        inLanguage: 'pt-BR',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': PERSON_ID },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Início',
              item: `${SITE_URL}/`,
            },
            { '@type': 'ListItem', position: 2, name: page.name, item: url },
          ],
        },
      },
      website,
      person,
    ],
  };
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Tags do <head> da página: título, descrição, canônica, Open Graph (LinkedIn, WhatsApp…) e JSON-LD. */
export function headTags(page: PageMeta) {
  const url = canonicalUrl(page);
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const imageAlt = escapeHtml(
    'Otávio Kessler Ustra, Desenvolvedor Full Stack Júnior em Ituiutaba-MG'
  );
  const isHome = page.path === '/';

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    page.noindex ? '' : `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:type" content="${isHome ? 'profile' : 'website'}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${imageAlt}" />`,
    isHome
      ? [
          `<meta property="profile:first_name" content="Otávio" />`,
          `<meta property="profile:last_name" content="Kessler Ustra" />`,
          `<meta property="profile:username" content="kessleru" />`,
        ].join('')
      : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:image:alt" content="${imageAlt}" />`,
    page.noindex
      ? ''
      : `<script type="application/ld+json">${JSON.stringify(
          structuredData(page)
        ).replace(/</g, '\\u003c')}</script>`,
  ];

  return tags.filter(Boolean).join('');
}
