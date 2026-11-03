import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'lenis/dist/lenis.css';
import './styles/index.css';
import App from './App.tsx';
import { loadTraining } from './pages/trainingLoader';
import { startSmoothScroll } from './lib/smooth';
import { startCursor } from './lib/cursor';

function start() {
  startSmoothScroll();
  startCursor();

  // O HTML pré-renderizado (feito para buscadores) é trocado pela versão interativa de uma vez.
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}

if (/^\/training\/?$/.test(location.pathname))
  loadTraining().then(start, start);
else start();
