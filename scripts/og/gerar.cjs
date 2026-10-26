// Gera a imagem de compartilhamento (public/og.png, 1200×630) e os ícones a partir de public/favicon.svg.
// Não faz parte do build: rode de novo só quando mudar nome, cargo ou foto.
//   curl -sL -o scripts/og/avatar.jpg "https://avatars.githubusercontent.com/u/90390195?s=800"
//   node scripts/og/gerar.cjs
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..', '..');
const pub = (file) => join(root, 'public', file);

(async () => {
  const browser = await chromium.launch();

  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.goto('file://' + join(__dirname, 'og.html'));
  await og.evaluate(() => document.fonts.ready);
  await og.waitForTimeout(300);
  await og.screenshot({ path: pub('og.png') });

  // Ícones: quadrado cheio para a Apple (o iOS arredonda sozinho), cantos arredondados nos demais.
  const svg = readFileSync(pub('favicon.svg'), 'utf8');
  const square = svg.replace('rx="3.5"', 'rx="0"');
  const icons = [
    ['favicon-48.png', 48, svg],
    ['apple-touch-icon.png', 180, square],
    ['icon-192.png', 192, svg],
    ['icon-512.png', 512, svg],
  ];
  for (const [file, size, source] of icons) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${source}`
    );
    await page.screenshot({ path: pub(file), omitBackground: true });
    await page.close();
  }

  await browser.close();
  console.log('og.png e ícones gerados em public/');
})();
