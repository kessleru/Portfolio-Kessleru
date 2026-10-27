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
    <div className="simple-page mx-auto flex min-h-dvh max-w-[46rem] flex-col px-5 font-sans sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-ctp-surface-0 py-6">
        <Link to="/" className="font-semibold text-ctp-text">
          Otávio Kessler Ustra
        </Link>
        <div className="flex items-center gap-5">
          <nav
            aria-label="Principal"
            className="flex flex-wrap gap-x-5 gap-y-1 text-sm"
          >
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'text-ctp-text underline decoration-ctp-accent decoration-2 underline-offset-[6px]'
                    : 'text-ctp-subtext-1 transition-colors hover:text-ctp-text'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setTheme(light ? 'mocha' : 'latte')}
            aria-label={light ? 'Usar tema escuro' : 'Usar tema claro'}
            title={light ? 'Tema escuro' : 'Tema claro'}
            className="cursor-pointer text-ctp-subtext-1 transition-colors hover:text-ctp-text"
          >
            {light ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
      </header>

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
  );
}

export default SimpleLayout;
