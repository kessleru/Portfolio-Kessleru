import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Home from '@/pages/Home';
import Projects from '@/pages/Projects';
import Contact from '@/pages/Contact';
import NotFound from '@/pages/404';
import { loadTraining, training } from '@/pages/trainingLoader';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import KessCompanion from '@/components/kess/KessCompanion';
import RouteMeta from '@/components/seo/RouteMeta';
import SimpleLayout from '@/components/simple/SimpleLayout';
import SimpleHome from '@/components/simple/SimpleHome';
import { useSimple } from '@/components/simple/simpleMode';

const LazyTraining = lazy(loadTraining);
// A versão simples da formação é só texto, mas usa os dados dos certificados: fica num pedaço à parte.
const SimpleTraining = lazy(() => import('@/components/simple/SimpleTraining'));

function TrainingRoute() {
  const Page = training.Page;
  if (Page) return <Page />;

  return (
    <Suspense fallback={null}>
      <LazyTraining />
    </Suspense>
  );
}

// O roteador fica de fora: BrowserRouter no navegador (main.tsx), StaticRouter no build (entry-server.tsx).
export default function App() {
  const simple = useSimple();

  // Quem escolheu a versão simples não vê o HTML pré-renderizado (versão completa) piscar:
  // o index.html esconde o #root até o React desenhar a versão certa.
  useEffect(() => {
    document.getElementById('root')?.setAttribute('data-app', '');
  }, []);

  return (
    <ThemeProvider>
      <Analytics />
      <RouteMeta />
      <a
        href="#conteudo"
        className="fixed top-3 left-3 z-50 -translate-y-16 rounded-lg bg-ctp-mantle px-4 py-2 text-sm text-ctp-accent shadow-lg transition-transform focus-visible:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      {simple ? (
        <SimpleLayout>
          <Routes>
            <Route path="/" element={<SimpleHome />} />
            <Route path="/projects" element={<Projects />} />
            <Route
              path="/training"
              element={
                <Suspense fallback={null}>
                  <SimpleTraining />
                </Suspense>
              }
            />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SimpleLayout>
      ) : (
        <div className="container py-4 sm:py-6 lg:py-8">
          <Header />
          <main id="conteudo" tabIndex={-1} className="outline-none">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/training" element={<TrainingRoute />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <KessCompanion />
        </div>
      )}
    </ThemeProvider>
  );
}
