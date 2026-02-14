import React from 'react';
import { createPortal } from 'react-dom';
import Card from './Cards/Card';

const Modal: React.FC<{
  isOpen: boolean;
  children: React.ReactNode;
}> = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="absolute right-4 top-20 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 ease-out sm:right-8">
      <Card fileName="Modal.tsx" className="w-[min(10rem,calc(100vw-2rem))]">
        {children}
      </Card>
    </div>,
    document.body
  );
};

export default Modal;
