// Depois do `vite build`: gera o HTML de cada página já com conteúdo e metadados.
// Buscadores e redes sociais (LinkedIn, WhatsApp, bots de IA) leem isso sem rodar JavaScript;
// no navegador o React troca esse HTML pela versão interativa.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrOut = join(root, 'dist-ssr');

await build({
  root,
  logLevel: 'warn',
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: ssrOut,
    emptyOutDir: true,
  },
});

const { render, headTags, pages, notFoundPage, canonicalUrl } = await import(
  pathToFileURL(join(ssrOut, 'entry-server.js')).href
);

const template = await readFile(join(dist, 'index.html'), 'utf8');
const manifest = JSON.parse(
  await readFile(join(dist, '.vite', 'manifest.json'), 'utf8')
);

// Quem chega direto em /training baixa o pedaço da página junto com o resto.
function preloads(path) {
  if (path !== '/training') return '';
  const entry = manifest['src/pages/Training.tsx'];
  if (!entry) return '';
  return `<link rel="modulepreload" crossorigin href="/${entry.file}" />`;
}

async function page(meta, file) {
  const app = await render(meta.path === '/404' ? '/404' : meta.path);
  const html = template
    .replace(
      /<!--seo-->[\s\S]*?<!--\/seo-->/,
      `<!--seo-->${headTags(meta)}${preloads(meta.path)}<!--/seo-->`
    )
    .replace('<!--app-html-->', app);

  if (html === template) throw new Error(`marcadores não encontrados em index.html`);
  const target = join(dist, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
  console.log(`  ${file}`);
}

console.log('pré-renderizando:');
for (const meta of pages) {
  await page(meta, meta.path === '/' ? 'index.html' : `${meta.path.slice(1)}/index.html`);
}
await page(notFoundPage, '404.html');

const urls = pages
  .filter((meta) => !meta.noindex)
  .map((meta) => `  <url><loc>${canonicalUrl(meta)}</loc></url>`)
  .join('\n');
await writeFile(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);
console.log('  sitemap.xml');

await rm(ssrOut, { recursive: true, force: true });
await rm(join(dist, '.vite'), { recursive: true, force: true });
