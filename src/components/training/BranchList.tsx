import { cn } from '@/lib/utils';
import type { Branch } from './history';

type BranchListProps = {
  branches: Branch[];
  focus: string | null;
  onFocus: (branch: string | null) => void;
};

// Uma linha por branch: clicar destaca o caminho dela no grafo.
function BranchList({ branches, focus, onFocus }: BranchListProps) {
  return (
    <ul className="space-y-1 text-xs sm:text-sm">
      {branches.map((branch) => {
        const active = focus === branch.name;

        return (
          <li key={branch.name}>
            <button
              type="button"
              onClick={() => onFocus(active ? null : branch.name)}
              aria-pressed={active}
              data-kess-mood="animado"
              className={cn(
                'grid w-full cursor-pointer grid-cols-[6ch_1fr] items-baseline gap-x-3 gap-y-0.5 rounded-md border px-3 py-2 text-left transition-colors sm:grid-cols-[6ch_1fr_auto]',
                active
                  ? 'border-ctp-accent/60 bg-ctp-surface-0'
                  : 'border-transparent hover:bg-ctp-crust/40',
                focus !== null && !active && 'opacity-50'
              )}
            >
              <span className="font-semibold" style={{ color: branch.color }}>
                {branch.name}
              </span>
              <span className="min-w-0">
                <span className="text-ctp-text">{branch.role}</span>
                <span className="text-ctp-subtext-0"> · {branch.place}</span>
              </span>
              <span className="col-start-2 text-ctp-overlay-1 sm:col-start-auto sm:text-right">
                {branch.period}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default BranchList;
