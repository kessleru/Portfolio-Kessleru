import { useLang, type Lang } from '@/lib/i18n';
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

/** Um quadradinho da grade. `future` marca os dias que ainda não chegaram na última semana. */
type Day = Contribution & { future?: boolean };

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

// Nomes fixos (e não toLocaleDateString) para o HTML do build sair igual em qualquer máquina.
const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Semanas vazias do tamanho de um ano, para o card não mudar de altura quando os dados chegam. */
const PLACEHOLDER_WEEKS = 53;

function toKey(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseKey(key: string) {
  return new Date(`${key}T00:00:00`);
}

function plural(count: number, lang: Lang) {
  if (lang === 'en')
    return count === 0
      ? 'no contributions'
      : count === 1
        ? '1 contribution'
        : `${count} contributions`;
  if (count === 0) return 'nenhuma contribuição';
  return count === 1 ? '1 contribuição' : `${count} contribuições`;
}

function formatDay(key: string, lang: Lang) {
  return parseKey(key).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function buildWeeks(contributions: Contribution[]): Day[][] {
  const sorted = [...contributions].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (sorted.length === 0) {
    return Array.from({ length: PLACEHOLDER_WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => ({
        date: `vazio-${w}-${d}`,
        count: 0,
      }))
    );
  }

  const firstDate = parseKey(sorted[0].date);
  const cursor = new Date(firstDate);
  cursor.setDate(firstDate.getDate() - firstDate.getDay());

  const map = new Map(sorted.map((item) => [item.date, item]));
  const lastKey = sorted[sorted.length - 1].date;
  const lastDate = parseKey(lastKey);
  const weeks: Day[][] = [];

  while (cursor <= lastDate) {
    const week: Day[] = [];

    for (let day = 0; day < 7; day += 1) {
      const key = toKey(cursor);
      week.push(map.get(key) ?? { date: key, count: 0, future: key > lastKey });
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
  }

  return weeks;
}

/**
 * Níveis como no GitHub: pelos quartis dos dias com contribuição, e não pelo dia recorde.
 * Com a escala pelo máximo, um único dia muito acima dos outros deixava o ano inteiro no tom mais claro.
 */
function buildLevels(contributions: Contribution[]) {
  const active = contributions
    .map((item) => item.count)
    .filter((count) => count > 0)
    .sort((a, b) => a - b);

  if (active.length === 0) return () => 0;

  const at = (p: number) =>
    active[Math.min(active.length - 1, Math.floor(p * active.length))];
  const q1 = at(0.25);
  const q2 = at(0.5);
  const q3 = at(0.75);

  return (count: number) => {
    if (count <= 0) return 0;
    if (count <= q1) return 1;
    if (count <= q2) return 2;
    if (count <= q3) return 3;
    return 4;
  };
}

type MonthLabel = {
  week: number;
  name: string;
  /** Só aparece quando a grade quebra em duas faixas (abre a segunda faixa). */
  wrapOnly?: boolean;
  /** Só aparece com o ano numa faixa: no fim da primeira faixa ele repetiria o começo da segunda. */
  rowOnly?: boolean;
};

/** Um rótulo onde o mês começa; perto demais do próximo (menos de 3 semanas), ele sai. */
function buildMonthLabels(weeks: Day[][], half: number): MonthLabel[] {
  if (weeks[0]?.[0]?.date.startsWith('vazio')) return [];

  const monthOf = (w: number) => parseKey(weeks[w][0].date).getMonth();
  const starts: number[] = [];

  for (let w = 0; w < weeks.length; w += 1) {
    if (w === 0 || monthOf(w) !== monthOf(w - 1)) starts.push(w);
  }

  const labels: MonthLabel[] = starts
    .filter((w, i) => {
      const next = starts[i + 1];
      // o último também sai se estiver colado na borda direita (não cabe o nome)
      return next === undefined ? weeks.length - w >= 3 : next - w >= 3;
    })
    .map((w) => ({
      week: w,
      name: MONTHS[monthOf(w)],
      rowOnly: w < half && w >= half - 2,
    }));

  // A segunda faixa ganha o nome do mês logo no começo, se nenhum rótulo cair ali.
  const hasNearStart = labels.some((l) => l.week >= half && l.week < half + 3);
  if (!hasNearStart && half < weeks.length) {
    labels.push({ week: half, name: MONTHS[monthOf(half)], wrapOnly: true });
  }

  return labels;
}

type Hovered = { date: string; count: number } | null;

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
  const [hovered, setHovered] = useState<Hovered>(null);

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
        setError('fail');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [username]);

  const { t, lang } = useLang();
  const weeks = useMemo(() => buildWeeks(data), [data]);

  // A grade é a parte pesada (uns 370 quadrados): fica memorizada, e passar o mouse só troca a legenda.
  const grid = useMemo(() => {
    const levelOf = buildLevels(data);
    const half = Math.ceil(weeks.length / 2);
    const labels = buildMonthLabels(weeks, half);
    const bands = [weeks.slice(0, half), weeks.slice(half)];

    return (
      <div
        className="heatmap__grid"
        style={
          {
            '--weeks': weeks.length,
            '--half': half,
          } as React.CSSProperties
        }
      >
        {bands.map((band, b) => {
          const offset = b * half;
          return (
            <div key={b} className="heatmap__band">
              {labels
                .filter(
                  (l) => l.week >= offset && l.week < offset + band.length
                )
                .map((l) => (
                  <span
                    key={`m-${l.week}`}
                    className={`heatmap__month${l.wrapOnly ? ' heatmap__month--wrap' : ''}${l.rowOnly ? ' heatmap__month--row' : ''}`}
                    style={{ gridColumn: l.week - offset + 1 }}
                  >
                    {lang === 'en' ? MONTHS_EN[MONTHS.indexOf(l.name)] : l.name}
                  </span>
                ))}
              {band.map((week, w) =>
                week.map((day, d) => {
                  const real = !day.future && !loading;
                  return (
                    <span
                      key={day.date}
                      className="heatmap__day"
                      data-level={day.future ? undefined : levelOf(day.count)}
                      data-future={day.future ? '' : undefined}
                      data-d={real ? day.date : undefined}
                      data-c={real ? day.count : undefined}
                      title={
                        real
                          ? `${formatDay(day.date, lang)}: ${plural(day.count, lang)}`
                          : undefined
                      }
                      style={{ gridColumn: w + 1, gridRow: d + 2 }}
                    />
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    );
  }, [data, weeks, loading, lang]);

  function handlePointerOver(event: React.PointerEvent<HTMLDivElement>) {
    const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-d]');
    if (!cell?.dataset.d) return;
    setHovered({ date: cell.dataset.d, count: Number(cell.dataset.c) });
  }

  const summary = loading
    ? t('Carregando contribuições…', 'Loading contributions…')
    : t(
        `${total} contribuições no último ano`,
        `${total} contributions in the last year`
      );

  // Duas partes que não se partem por dentro: no celular a segunda desce inteira.
  let readout: string[] = [];
  if (hovered) {
    readout = [formatDay(hovered.date, lang), plural(hovered.count, lang)];
  }

  return (
    <Card fileName="Commits.tsx" className={className}>
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tabular-nums sm:text-sm">
            {summary}
          </p>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noreferrer"
            data-kess-mood="animado"
            data-kess-say={t('os repositórios estão lá', 'the repos are there')}
            className="text-xs text-ctp-subtext-0 transition-colors hover:text-ctp-accent sm:text-sm"
          >
            @{username}
          </a>
        </div>

        {error ? (
          <p className="text-sm text-ctp-red">
            {t(
              'Falha ao carregar contribuições do GitHub.',
              'Could not load GitHub contributions.'
            )}
          </p>
        ) : (
          <div
            className="heatmap"
            role="img"
            aria-label={
              loading
                ? t(
                    'Mapa de contribuições carregando',
                    'Contribution map loading'
                  )
                : t(
                    `Mapa de contribuições no GitHub: ${total} no último ano`,
                    `GitHub contribution map: ${total} in the last year`
                  )
            }
            onPointerOver={handlePointerOver}
            onPointerLeave={() => setHovered(null)}
          >
            {grid}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-ctp-meta">
          <p className="flex min-h-4 flex-wrap gap-x-3 tabular-nums">
            {readout.map((part, i) => (
              <span key={i} className="whitespace-nowrap">
                {part}
              </span>
            ))}
          </p>
          <div className="flex items-center gap-2" aria-hidden="true">
            <span>{t('Menos', 'Less')}</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className="heatmap__day heatmap__day--key"
                  data-level={level}
                />
              ))}
            </div>
            <span>{t('Mais', 'More')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default CommitHeatmapCard;
