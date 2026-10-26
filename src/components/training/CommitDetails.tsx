import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Branch, Commit } from './history';

type CommitDetailsProps = {
  commit: Commit;
  branches: Branch[];
  onPrev?: () => void;
  onNext?: () => void;
};

const navButton =
  'grid size-7 cursor-pointer place-items-center rounded-md border border-ctp-overlay-0/40 text-ctp-subtext-0 transition-colors hover:border-ctp-accent hover:text-ctp-accent disabled:cursor-default disabled:opacity-30 disabled:hover:border-ctp-overlay-0/40 disabled:hover:text-ctp-subtext-0';

function CommitDetails({
  commit,
  branches,
  onPrev,
  onNext,
}: CommitDetailsProps) {
  const branch = branches.find((item) => item.name === commit.branch);

  return (
    <div className="flex items-start gap-4 rounded-md border border-ctp-crust/60 bg-ctp-crust/40 p-4">
      <div
        key={commit.id}
        className="min-w-0 flex-1 animate-in duration-300 fade-in slide-in-from-left-2"
      >
        <p className="mb-1 flex flex-wrap items-center gap-x-2 text-xs">
          <span className="font-semibold" style={{ color: branch?.color }}>
            {commit.branch}
          </span>
          {commit.date && (
            <span className="text-ctp-overlay-1">· {commit.date}</span>
          )}
          {commit.planned && (
            <span className="text-ctp-overlay-1">· previsto</span>
          )}
        </p>
        <h3 className="text-sm font-semibold text-ctp-text sm:text-base">
          {commit.title}
        </h3>
        {commit.body && (
          <div className="mt-2 space-y-1 text-xs text-ctp-subtext-0 sm:text-sm">
            {commit.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!onPrev}
          className={navButton}
          aria-label="Anterior"
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!onNext}
          className={navButton}
          aria-label="Próximo"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default CommitDetails;
