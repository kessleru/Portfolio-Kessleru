import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Modal from '../ui/Modal';

function Header() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 650);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleSize() {
      setIsMobile(window.innerWidth < 650);
    }

    handleSize();
    window.addEventListener('resize', handleSize);

    return () => window.removeEventListener('resize', handleSize);
  }, []);

  return (
    <header className="mb-8 flex items-center justify-between rounded-full border-2 border-ctp-crust/20 bg-ctp-mantle px-3 py-2 shadow-md sm:mb-12 sm:px-4 sm:py-2.5 lg:mb-16">
      <div className='text-sm sm:text-base tracking-widest relative after:content-[""] after:ml-0.5 after:inline-block after:w-2 after:h-4 after:bg-ctp-accent after:top-1 after:absolute after:cursor-blink *:mr-px'>
        <span className="text-ctp-accent font-medium">~</span>
        <span>/</span>
        <span>home</span>
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
              {['Home', 'Projects', 'Academic', 'Contact'].map((item) => (
                <a
                  key={item}
                  className="block text-sm sm:text-base cursor-pointer hover:text-ctp-accent"
                >
                  {item}
                </a>
              ))}
            </div>
          </Modal>
        </>
      ) : (
        <nav className="flex items-center gap-2">
          {['Home', 'Projects', 'Academic', 'Contact'].map(
            (item, index, items) => (
              <span key={item} className="flex items-center">
                <a className="relative text-sm lg:text-base cursor-pointer hover:text-ctp-accent">
                  {item}
                </a>
                {index !== items.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="ml-2 text-ctp-overlay-0 select-none pointer-events-none"
                  >
                    |
                  </span>
                )}
              </span>
            )
          )}
        </nav>
      )}
    </header>
  );
}

export default Header;
