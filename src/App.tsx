import Home from '@/pages/Home';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Projects from './pages/Projects';

export default function App() {
  return (
    <ThemeProvider>
      <div className="container py-4 sm:py-6 lg:py-8">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}
