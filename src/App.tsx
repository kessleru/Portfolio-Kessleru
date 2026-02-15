import Home from '@/pages/Home';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Projects from './pages/Projects';
import Training from './pages/Training';
import Contact from './pages/Contact';
import NotFound from './pages/404';

export default function App() {
  return (
    <ThemeProvider>
      <div className="container py-4 sm:py-6 lg:py-8">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/training" element={<Training />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}
