import Header from '@/components/layout/Header';
import { TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section>
      <Header />

      <div className="flex min-h-[55vh] flex-col items-start justify-center gap-4">
        <p className="flex items-center gap-2 text-sm font-medium text-ctp-accent">
          <TriangleAlert size={16} />
          Erro 404
        </p>

        <h1 className="text-3xl font-bold sm:text-4xl">
          Página não encontrada.
        </h1>

        <p className="max-w-[60ch] text-sm text-ctp-subtext-0 sm:text-base">
          O caminho que você tentou acessar não existe ou foi movido.
        </p>

        <div className="mt-2 flex items-center gap-3">
          <Link
            to="/"
            className="rounded-lg border-2 border-ctp-accent/70 px-4 py-2 text-sm font-medium text-ctp-accent transition-colors hover:bg-ctp-accent/10"
          >
            Voltar para início
          </Link>

          <Link
            to="/projects"
            className="text-sm text-ctp-subtext-0 transition-colors hover:text-ctp-accent"
          >
            Ver projetos
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NotFound;
