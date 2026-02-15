import Header from '@/components/layout/Header';
import { TriangleAlert } from 'lucide-react';

function Contact() {
  return (
    <section>
      <Header />

      <div className="flex min-h-[55vh] flex-col items-start justify-center gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-ctp-accent">
          <TriangleAlert size={16} />
          Aviso
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">Em construção</h1>
        <p className="max-w-[60ch] text-sm text-ctp-subtext-0 sm:text-base">
          A página de contato está em desenvolvimento.
        </p>
      </div>
    </section>
  );
}

export default Contact;
