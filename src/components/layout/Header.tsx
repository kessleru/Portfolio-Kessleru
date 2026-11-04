import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import Modal from '../ui/Modal';
import { Link, useLocation } from 'react-router-dom';
import { SiGithub, SiLinkedin } from 'react-icons/si';
import LangToggle from '../ui/LangToggle';
import { useLang } from '@/lib/i18n';

const navItems = [
  { label: 'Início', en: 'Home', to: '/' },
  { label: 'Projetos', en: 'Projects', to: '/projects' },
  { label: 'Formação', en: 'Education', to: '/training' },
  { label: 'Contato', en: 'Contact', to: '/contact' },
];

const socials = [
  {
    label: 'GitHub',
    href: 'https://github.com/kessleru',
    Icon: SiGithub,
    say: 'os repositórios estão lá',
    sayEn: 'the repos are there',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/otavio-ustra-8b50bb364/',
    Icon: SiLinkedin,
    say: 'vamos conversar?',
    sayEn: "let's talk?",
  },
];

/** GitHub e LinkedIn só com o ícone, no canto do header (em toda página). */
function Socials() {
  const { t } = useLang();
  return (
    <span className="flex items-center gap-1">
      <LangToggle />
      {socials.map(({ label, href, Icon, say, sayEn }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="me noreferrer"
          aria-label={label}
          title={label}
          data-kess-mood="animado"
          data-kess-say={t(say, sayEn)}
          className="grid size-8 place-items-center rounded-md text-ctp-meta transition-colors hover:text-ctp-accent"
        >
          <Icon size={17} aria-hidden="true" />
        </a>
      ))}
    </span>
  );
}

const pathnameLabelMap: Record<string, [string, string]> = {
  '/': ['início', 'home'],
  '/projects': ['projetos', 'projects'],
  '/training': ['formação', 'education'],
  '/contact': ['contato', 'contact'],
};

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const { t } = useLang();

  // Menu e navegação trocam por CSS (o HTML pré-renderizado já sai certo em qualquer tela);
  // aqui só fecha o menu se a janela crescer com ele aberto.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 650px)');
    const close = () => wide.matches && setIsOpen(false);
    wide.addEventListener('change', close);
    return () => wide.removeEventListener('change', close);
  }, []);

  return (
    <header className="mb-8 rounded-lg border-2 border-ctp-crust/20 bg-ctp-mantle shadow-lg sm:mb-12 lg:mb-16 overflow-hidden">
      {/* VS Code title bar */}
      <div className="flex items-center justify-between border-b border-ctp-crust/40 bg-ctp-crust/30 px-3 py-1.5 select-none">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-ctp-red" />
          <span className="size-2.5 rounded-full bg-ctp-yellow" />
          <span className="size-2.5 rounded-full bg-ctp-green" />
        </div>
        <span className="text-[10px] sm:text-xs text-ctp-meta tracking-wide">
          Portfolio — Visual Studio Code
        </span>
        <div className="w-13" />
      </div>

      {/* conteúdo do header */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5">
        <div className='text-sm sm:text-base tracking-wide relative after:content-[""] after:ml-0.5 after:inline-block after:w-2 after:h-4 after:bg-ctp-accent after:top-1 after:absolute after:cursor-blink *:mr-px'>
          <Link to="/">
            <span className="nav-pill text-ctp-accent font-medium hover:text-ctp-subtext-0">
              ~
            </span>
          </Link>

          <span>/</span>
          <span>
            {pathnameLabelMap[location.pathname]
              ? t(...pathnameLabelMap[location.pathname])
              : location.pathname.substring(1)}
          </span>
          <span>/</span>
        </div>
        <div className="flex items-center gap-2 min-[650px]:hidden">
          <Socials />
          <button
            ref={menuButton}
            className="cursor-pointer text-ctp-accent transition-colors duration-200"
            aria-label={t('Abrir menu', 'Open menu')}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <Menu
              className={`transition-transform duration-300 ease-out ${isOpen ? 'rotate-90 scale-110' : 'rotate-0 scale-100'}`}
            />
          </button>
          <Modal isOpen={isOpen} anchor={menuButton}>
            <div className="divide-y-2 divide-ctp-crust [&>*:not(:last-child)]:pb-2 [&>*:not(:first-child)]:pt-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block text-sm sm:text-base cursor-pointer hover:text-ctp-accent"
                  onClick={() => setIsOpen(false)}
                >
                  {t(item.label, item.en)}
                </Link>
              ))}
            </div>
          </Modal>
        </div>
        <nav
          aria-label="Principal"
          className="flex items-center gap-2 max-[650px]:hidden"
        >
          {navItems.map((item, index, items) => (
            <span key={item.to} className="flex items-center">
              <Link
                to={item.to}
                className="nav-pill relative text-sm lg:text-base cursor-pointer hover:text-ctp-accent"
              >
                {t(item.label, item.en)}
              </Link>
              {index !== items.length - 1 && (
                <span
                  aria-hidden="true"
                  className="ml-2 h-4 w-px bg-ctp-overlay-0 pointer-events-none"
                />
              )}
            </span>
          ))}
          <span
            aria-hidden="true"
            className="mr-1 ml-3 h-4 w-px bg-ctp-surface-1"
          />
          <Socials />
        </nav>
      </div>
    </header>
  );
}

export default Header;
