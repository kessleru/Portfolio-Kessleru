import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Menu suspenso logo abaixo do botão que o abre (`anchor`), sem aba de arquivo. */
const Modal: React.FC<{
  isOpen: boolean;
  anchor: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}> = ({ isOpen, anchor, children }) => {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const place = () => {
      const r = anchor.current?.getBoundingClientRect();
      // cola logo abaixo da barra do cabeçalho, alinhado ao botão
      const bar = anchor.current?.closest('header')?.getBoundingClientRect();
      if (!r) return;
      setPos({
        top: (bar?.bottom ?? r.bottom) + window.scrollY + 8,
        right: Math.max(16, document.documentElement.clientWidth - r.right - 4),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [isOpen, anchor]);

  if (!isOpen || !pos) return null;

  return createPortal(
    <div
      className="absolute z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 ease-out"
      style={{ top: pos.top, right: pos.right }}
    >
      <div className="w-[min(12rem,calc(100vw-2rem))] rounded-lg border-2 border-ctp-crust/20 bg-ctp-mantle p-4 shadow-lg">
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
