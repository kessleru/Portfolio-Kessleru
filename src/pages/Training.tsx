import { useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import Card from '@/components/ui/Cards/Card';
import KessGreeter from '@/components/kess/KessGreeter';
import BranchList from '@/components/training/BranchList';
import CommitDetails from '@/components/training/CommitDetails';
import Extensions from '@/components/training/Extensions';
import GitTimeline from '@/components/training/GitTimeline';
import { branches, commits } from '@/components/training/history';

// Começa mostrando o commit mais recente da graduação.
const latestId = [...commits]
  .reverse()
  .find((commit) => commit.branch === 'iftm' && !commit.planned)?.id;

function BranchName({ name }: { name: string }) {
  const color = branches.find((branch) => branch.name === name)?.color;

  return (
    <span
      data-kess-mood="curioso"
      className="border-b-2 border-dashed"
      style={{ color, borderColor: color }}
    >
      {name}
    </span>
  );
}

function Training() {
  const [focus, setFocus] = useState<string | null>(null);
  const [selected, setSelected] = useState(latestId ?? commits[0].id);
  const [replay, setReplay] = useState(0);

  const index = commits.findIndex((commit) => commit.id === selected);
  const commit = commits[index];

  return (
    <section className="space-y-8">
      <div className="space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <KessGreeter className="-my-2 shrink-0" />
          <div className="flex flex-wrap items-center gap-2 text-xl font-bold sm:text-2xl">
            <span className="text-ctp-accent max-sm:hidden">&gt;</span>
            <h1>Formação</h1>
          </div>
        </div>
        <div className="max-w-[70ch] space-y-2 text-sm text-balance text-ctp-subtext-0 sm:text-base">
          <p>
            Minha formação contada como um repositório: a{' '}
            <BranchName name="main" /> é a base, e cada fase abriu uma branch.
            Hoje seguem abertas a <BranchName name="iftm" />, a{' '}
            <BranchName name="pet" /> e a <BranchName name="sae" />. Quando a{' '}
            <BranchName name="iftm" /> for mergeada, é formatura.
          </p>
          <p>
            Clique numa branch para destacar o caminho dela e num commit para
            ver os detalhes.
          </p>
        </div>
      </div>

      <Card fileName="Branches.tsx" className="w-full">
        <BranchList branches={branches} focus={focus} onFocus={setFocus} />
      </Card>

      <Card fileName="GitGraph.tsx" className="w-full">
        <div className="flex justify-end text-xs sm:text-sm">
          <div className="flex items-center gap-4">
            {focus && (
              <button
                type="button"
                onClick={() => setFocus(null)}
                className="flex cursor-pointer items-center gap-1 text-ctp-subtext-0 transition-colors hover:text-ctp-accent"
              >
                <X size={14} aria-hidden="true" />
                limpar filtro
              </button>
            )}
            <button
              type="button"
              onClick={() => setReplay((count) => count + 1)}
              data-kess-mood="animado"
              className="flex cursor-pointer items-center gap-1 text-ctp-subtext-0 transition-colors hover:text-ctp-accent"
            >
              <RotateCcw size={14} aria-hidden="true" />
              replay
            </button>
          </div>
        </div>

        <GitTimeline
          key={replay}
          commits={commits}
          branches={branches}
          focus={focus}
          selected={selected}
          onSelect={setSelected}
        />
        <p className="mb-3 text-[11px] text-ctp-overlay-1 sm:hidden">
          ← arraste para ver o começo
        </p>

        {commit && (
          <CommitDetails
            commit={commit}
            branches={branches}
            onPrev={
              index > 0 ? () => setSelected(commits[index - 1].id) : undefined
            }
            onNext={
              index < commits.length - 1
                ? () => setSelected(commits[index + 1].id)
                : undefined
            }
          />
        )}
      </Card>

      <div className="space-y-3 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-xl font-bold sm:text-2xl">
          <span className="text-ctp-accent max-sm:hidden">&gt;</span>
          <h2>Certificados</h2>
        </div>
        <p className="max-w-[70ch] text-sm text-balance text-ctp-subtext-0 sm:text-base">
          Cada curso concluído é uma extensão instalada. Filtre por competência
          e clique num card para ver a credencial.
        </p>
      </div>

      <Card fileName="Extensions.tsx" className="w-full">
        <Extensions />
      </Card>
    </section>
  );
}

export default Training;
