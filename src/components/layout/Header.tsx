import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Modal from '../ui/Modal';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Início', to: '/' },
  { label: 'Projetos', to: '/projects' },
  { label: 'Formação', to: '/training' },
  { label: 'Contato', to: '/contact' },
];

const pathnameLabelMap: Record<string, string> = {
  '/': 'início',
  '/projects': 'projetos',
  '/training': 'formação',
  '/contact': 'contato',
};

function Header() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 650);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    function handleSize() {
      setIsMobile(window.innerWidth < 650);
    }

    handleSize();
    window.addEventListener('resize', handleSize);

    return () => window.removeEventListener('resize', handleSize);
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
        <span className="text-[10px] sm:text-xs text-ctp-overlay-1 tracking-wide">
          Portfolio — Visual Studio Code
        </span>
        <div className="w-13" />
      </div>

      {/* conteúdo do header */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5">
        <div className='text-sm sm:text-base tracking-widest relative after:content-[""] after:ml-0.5 after:inline-block after:w-2 after:h-4 after:bg-ctp-accent after:top-1 after:absolute after:cursor-blink *:mr-px'>
          <Link to="/">
            <span className="text-ctp-accent font-medium hover:text-ctp-subtext-0">
              ~
            </span>
          </Link>

          <span>/</span>
          <span>
            {pathnameLabelMap[location.pathname] ??
              location.pathname.substring(1)}
          </span>
          <span>/</span>
        </div>
        {isMobile ? (
          <>
            <button
              className="cursor-pointer text-ctp-accent transition-colors duration-200"
              aria-label="Abrir menu"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <Menu
                className={`transition-transform duration-300 ease-out ${isOpen ? 'rotate-90 scale-110' : 'rotate-0 scale-100'}`}
              />
            </button>
            <Modal isOpen={isOpen}>
              <div className="divide-y-2 divide-ctp-crust [&>*:not(:last-child)]:pb-2 [&>*:not(:first-child)]:pt-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block text-sm sm:text-base cursor-pointer hover:text-ctp-accent"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </Modal>
          </>
        ) : (
          <nav className="flex items-center gap-2">
            {navItems.map((item, index, items) => (
              <span key={item.to} className="flex items-center">
                <Link
                  to={item.to}
                  className="relative text-sm lg:text-base cursor-pointer hover:text-ctp-accent"
                >
                  {item.label}
                </Link>
                {index !== items.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="ml-2 text-ctp-overlay-0 select-none pointer-events-none"
                  >
                    |
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
