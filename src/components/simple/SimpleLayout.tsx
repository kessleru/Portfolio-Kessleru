import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutGrid, Moon, Sun } from 'lucide-react';
import { SiGithub, SiLinkedin } from 'react-icons/si';
import { useTheme } from '@/components/theme/ThemeProvider';
import { setSimple } from './simpleMode';

const nav = [
  { label: 'Início', to: '/' },
  { label: 'Projetos', to: '/projects' },
  { label: 'Formação', to: '/training' },
  { label: 'Contato', to: '/contact' },
];

/** Moldura da versão simples: uma coluna estreita de texto, como um blog. */
function SimpleLayout({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const light = theme === 'latte';

  return (
    <div className="simple-page flex min-h-dvh flex-col font-sans">
      {/* mesmo cabeçalho do material do minicurso: logo e tema em cima, menu embaixo com a linha na página atual */}
      <header className="sticky top-0 z-40 border-b border-ctp-surface-0 bg-ctp-base/85 backdrop-blur">
        <div className="mx-auto flex max-w-[46rem] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link
            to="/"
            className="font-mono text-sm font-semibold text-ctp-text"
          >
            portfolio<span className="text-ctp-accent">/kessleru</span>
          </Link>
          <button
            type="button"
            onClick={() => setTheme(light ? 'mocha' : 'latte')}
            aria-label={light ? 'Usar tema escuro' : 'Usar tema claro'}
            title={light ? 'Tema escuro' : 'Tema claro'}
            className="cursor-pointer rounded-md p-1.5 text-ctp-subtext-0 transition-colors hover:text-ctp-text"
          >
            {light ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
        <nav
          aria-label="Principal"
          className="mx-auto flex max-w-[46rem] gap-6 overflow-x-auto overflow-y-hidden px-5 text-sm [scrollbar-width:none] sm:px-8"
        >
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="nav-link relative whitespace-nowrap py-2.5 text-ctp-subtext-0 transition-colors hover:text-ctp-text aria-[current=page]:text-ctp-text"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-[46rem] flex-1 flex-col px-5 sm:px-8">
        <main
          id="conteudo"
          tabIndex={-1}
          className="flex-1 py-12 outline-none sm:py-16"
        >
          {children}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-ctp-surface-0 py-8 text-sm text-ctp-subtext-0">
          <span>© {new Date().getFullYear()} Otávio Kessler Ustra</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href="https://github.com/kessleru"
              target="_blank"
              rel="me noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ctp-text"
            >
              <SiGithub size={14} aria-hidden="true" /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/otavio-ustra-8b50bb364/"
              target="_blank"
              rel="me noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ctp-text"
            >
              <SiLinkedin size={14} aria-hidden="true" /> LinkedIn
            </a>
            <button
              type="button"
              onClick={() => setSimple(false)}
              className="inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-ctp-text"
            >
              <LayoutGrid size={14} aria-hidden="true" /> Versão completa
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default SimpleLayout;
