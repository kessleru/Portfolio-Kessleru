import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Cards/Card';

type Contribution = {
  date: string;
  count: number;
};

type ContributionsResponse = {
  total?: {
    lastYear?: number;
  };
  contributions?: Contribution[];
};

type CommitHeatmapCardProps = {
  username?: string;
  className?: string;
};

type CachedContributions = {
  data: Contribution[];
  total: number;
  fetchedAt: number;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let contributionsCache: CachedContributions | null = null;
let inFlightRequest: Promise<CachedContributions> | null = null;

function getValidCachedContributions() {
  const cached = contributionsCache;

  if (!cached) return null;

  const isExpired = Date.now() - cached.fetchedAt > CACHE_TTL_MS;
  if (isExpired) {
    contributionsCache = null;
    return null;
  }

  return cached;
}

async function fetchContributions(
  username: string
): Promise<CachedContributions> {
  const existingRequest = inFlightRequest;
  if (existingRequest) return existingRequest;

  const request = (async () => {
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
    );

    if (!response.ok) {
      throw new Error('Não foi possível buscar as contribuições.');
    }

    const json = (await response.json()) as ContributionsResponse;

    const result = {
      data: json.contributions ?? [],
      total: json.total?.lastYear ?? 0,
      fetchedAt: Date.now(),
    };

    contributionsCache = result;

    return result;
  })();

  inFlightRequest = request;

  try {
    return await request;
  } finally {
    inFlightRequest = null;
  }
}

function getIntensity(count: number, maxCount: number) {
  if (count <= 0) return 0;
  if (maxCount <= 1) return 4;

  const ratio = count / maxCount;

  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;

  return 4;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildWeeks(contributions: Contribution[]) {
  const sorted = [...contributions].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (sorted.length === 0) return [] as Contribution[][];

  const firstDate = new Date(`${sorted[0].date}T00:00:00`);
  const startDate = new Date(firstDate);
  startDate.setDate(firstDate.getDate() - firstDate.getDay());

  const map = new Map(sorted.map((item) => [item.date, item]));
  const weeks: Contribution[][] = [];
  const cursor = new Date(startDate);
  const lastDate = new Date(`${sorted[sorted.length - 1].date}T00:00:00`);

  while (cursor <= lastDate) {
    const week: Contribution[] = [];

    for (let day = 0; day < 7; day += 1) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      week.push(map.get(dateKey) ?? { date: dateKey, count: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
  }

  return weeks;
}

function CommitHeatmapCard({
  username = 'kessleru',
  className = '',
}: CommitHeatmapCardProps) {
  const cachedInitial = getValidCachedContributions();

  const [data, setData] = useState<Contribution[]>(
    () => cachedInitial?.data ?? []
  );
  const [total, setTotal] = useState(() => cachedInitial?.total ?? 0);
  const [loading, setLoading] = useState(() => !cachedInitial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const cached = getValidCachedContributions();

    if (cached) {
      setData(cached.data);
      setTotal(cached.total);
      setError(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchContributions(username);

        if (!mounted) return;

        setData(result.data);
        setTotal(result.total);
      } catch {
        if (!mounted) return;
        setError('Falha ao carregar contribuições do GitHub.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [username]);

  const weeks = useMemo(() => buildWeeks(data), [data]);
  const maxCount = useMemo(
    () => data.reduce((max, item) => Math.max(max, item.count), 0),
    [data]
  );

  return (
    <Card fileName="Commits.tsx" className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-semibold">
            {loading
              ? 'Carregando contribuições...'
              : `${total} contribuições no último ano`}
          </p>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs sm:text-sm text-ctp-subtext-0 hover:text-ctp-accent"
          >
            @{username}
          </a>
        </div>

        {error ? (
          <p className="text-sm text-ctp-red">{error}</p>
        ) : (
          <div className="overflow-x-auto pb-1">
            <div className="inline-grid auto-cols-max grid-flow-col gap-1 min-w-max">
              {weeks.map((week, weekIndex) => (
                <div
                  key={`week-${weekIndex}`}
                  className="grid grid-rows-7 gap-1"
                >
                  {week.map((day) => {
                    const intensity = getIntensity(day.count, maxCount);

                    return (
                      <span
                        key={day.date}
                        title={`${formatDate(day.date)}: ${day.count} commits`}
                        className="h-3 w-3 rounded-[3px] border border-ctp-overlay-0/30"
                        style={
                          intensity === 0
                            ? { backgroundColor: 'var(--ctp-surface-0)' }
                            : {
                                backgroundColor: 'var(--ctp-accent)',
                                opacity: 0.25 + intensity * 0.17,
                              }
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 text-xs text-ctp-subtext-0">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((intensity) => (
              <span
                key={intensity}
                className="h-3 w-3 rounded-[3px] border border-ctp-overlay-0/30"
                style={
                  intensity === 0
                    ? { backgroundColor: 'var(--ctp-surface-0)' }
                    : {
                        backgroundColor: 'var(--ctp-accent)',
                        opacity: 0.25 + intensity * 0.17,
                      }
                }
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </Card>
  );
}

export default CommitHeatmapCard;
