// Título de seção da versão simples: rótulo pequeno com um fio até a borda, para separar
// as partes da página sem competir com o título principal nem com o conteúdo.
function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2
      id={id}
      className="flex items-center gap-3 font-mono text-xs font-medium text-ctp-meta"
    >
      {children}
      <span aria-hidden="true" className="h-px flex-1 bg-ctp-surface-0" />
    </h2>
  );
}

export default SectionTitle;
