import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import App from './App';
import { loadTraining } from './pages/trainingLoader';

// Arquivo do build, sem hot reload: pode exportar funções.
// eslint-disable-next-line react-refresh/only-export-components
export * from './seo';

// Usado só no build (scripts/prerender.mjs): gera o HTML de cada página.
export async function render(url: string) {
  await loadTraining();
  const { prelude } = await prerender(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>
  );
  return new Response(prelude).text();
}
