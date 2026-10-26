import { lazy, Suspense } from 'react';
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

const LazyTraining = lazy(loadTraining);

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
    </ThemeProvider>
  );
}
