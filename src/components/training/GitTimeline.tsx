import { useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { Branch, Commit } from './history';

type GitTimelineProps = {
  commits: Commit[];
  branches: Branch[];
  focus: string | null;
  selected: string | null;
  onSelect: (id: string) => void;
};

const COL = 64;
const LEFT = 104;
const LANE_Y: Record<string, number> = {
  sae: 56,
  main: 124,
  iftm: 192,
  pet: 260,
};
// Nas faixas de cima o rótulo fica acima do nó; nas de baixo, abaixo.
const LABEL_ABOVE = new Set(['sae', 'main']);
const AXIS_Y = 318;
const HEIGHT = 340;
const SWEEP = 2.2;

function GitTimeline({
  commits,
  branches,
  focus,
  selected,
  onSelect,
}: GitTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(svgRef, { once: true, amount: 0.35 });
  const reduce = useReducedMotion();

  const real = commits.filter((commit) => !commit.planned);
  const planned = commits.filter((commit) => commit.planned);
  const todayX = LEFT + (real.length - 1) * COL + COL * 0.75;
  const plannedX = todayX + COL * 1.25;
  const width = plannedX + 56;

  const column = new Map(real.map((commit, index) => [commit.id, index]));
  const byId = new Map(commits.map((commit) => [commit.id, commit]));
  const xOf = (commit: Commit) =>
    commit.planned ? plannedX : LEFT + (column.get(commit.id) ?? 0) * COL;
  const yOf = (commit: Commit) => LANE_Y[commit.branch];
  const colorOf = (name: string) =>
    branches.find((branch) => branch.name === name)?.color ?? 'var(--ctp-text)';
  const dimmed = (name: string) => focus !== null && focus !== name;

  // A animação "varre" da esquerda para a direita: cada elemento aparece quando ela passa por ele.
  const sweep = reduce ? 0 : SWEEP;
  const timeAt = (x: number) =>
    Math.min(Math.max((x - LEFT) / (todayX - LEFT), 0), 1) * sweep;
  const shown = inView || Boolean(reduce);

  // No celular o grafo rola de lado; começa mostrando o presente.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const lines = branches.map((branch) => {
    const own = real.filter((commit) => commit.branch === branch.name);
    const first = own[0];
    const y = LANE_Y[branch.name];
    const parent = first && byId.get(first.parents[0]);
    let d: string;
    let startX: number;

    if (first && parent && parent.branch !== branch.name) {
      const fx = xOf(first);
      startX = Math.max(xOf(parent), fx - COL);
      const py = yOf(parent);
      const mid = (startX + fx) / 2;
      d = `M ${startX} ${py} C ${mid} ${py} ${mid} ${y} ${fx} ${y}`;
    } else {
      startX = first ? xOf(first) : LEFT;
      d = `M ${startX} ${y}`;
    }
    own.slice(1).forEach((commit) => (d += ` L ${xOf(commit)} ${y}`));
    d += ` L ${todayX} ${y}`;

    return { branch, d, startX };
  });

  // O que ainda vai acontecer sai do "hoje", tracejado.
  const future = planned.flatMap((commit) => {
    const x = xOf(commit);
    const y = yOf(commit);
    return commit.parents.map((parentId) => {
      const parent = byId.get(parentId);
      const py = parent ? yOf(parent) : y;
      const mid = (todayX + x) / 2;
      return {
        key: `${commit.id}-${parentId}`,
        branch: parent?.branch ?? commit.branch,
        d:
          py === y
            ? `M ${todayX} ${y} L ${x} ${y}`
            : `M ${todayX} ${py} C ${mid} ${py} ${mid} ${y} ${x} ${y}`,
      };
    });
  });

  const active = commits.find((commit) => commit.id === selected);

  const years = [...commits]
    .sort((a, b) => xOf(a) - xOf(b))
    .reduce<{ year: number; x: number }[]>((ticks, commit, index, list) => {
      if (index === 0 || commit.year !== list[index - 1].year) {
        const prevX = index === 0 ? xOf(commit) - COL : xOf(list[index - 1]);
        ticks.push({ year: commit.year, x: (prevX + xOf(commit)) / 2 });
      }
      return ticks;
    }, []);

  return (
    <div ref={scrollRef} className="overflow-x-auto pb-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block h-auto w-full min-w-[880px] select-none"
        role="group"
        aria-label="Linha do tempo da formação em formato de grafo do git"
      >
        {/* eixo dos anos */}
        <line
          x1={LEFT - 24}
          x2={width - 16}
          y1={AXIS_Y - 16}
          y2={AXIS_Y - 16}
          stroke="var(--ctp-surface-0)"
        />
        {years.map(({ year, x }) => (
          <g key={year}>
            <line
              x1={x}
              x2={x}
              y1={AXIS_Y - 20}
              y2={AXIS_Y - 12}
              stroke="var(--ctp-surface-2)"
            />
            <text
              x={x + 6}
              y={AXIS_Y}
              fontSize={11}
              fill="var(--ctp-overlay-1)"
            >
              {year}
            </text>
          </g>
        ))}

        {/* hoje */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={shown ? { opacity: 1 } : {}}
          transition={{ delay: timeAt(todayX), duration: 0.4 }}
        >
          <line
            x1={todayX}
            x2={todayX}
            y1={22}
            y2={AXIS_Y - 16}
            stroke="var(--ctp-overlay-0)"
            strokeOpacity={0.5}
            strokeDasharray="2 4"
          />
          <text
            x={todayX}
            y={14}
            textAnchor="middle"
            fontSize={11}
            fill="var(--ctp-overlay-1)"
          >
            hoje
          </text>
        </motion.g>

        {/* nome das branches, como no `git branch` */}
        {branches.map((branch) => (
          <g
            key={branch.name}
            className="transition-opacity duration-300"
            opacity={dimmed(branch.name) ? 0.35 : 1}
          >
            <text
              x={LEFT - 64}
              y={LANE_Y[branch.name] + 4}
              fontSize={13}
              fontWeight={600}
              fill={branch.color}
            >
              {branch.name}
            </text>
          </g>
        ))}

        {/* linhas */}
        {lines.map(({ branch, d, startX }) => (
          <g
            key={branch.name}
            className="transition-opacity duration-300"
            opacity={dimmed(branch.name) ? 0.2 : 1}
          >
            <motion.path
              d={d}
              fill="none"
              stroke={branch.color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.85}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={shown ? { pathLength: 1, opacity: 1 } : {}}
              transition={{
                delay: timeAt(startX),
                duration: timeAt(todayX) - timeAt(startX),
                ease: 'linear',
                // sem isso a ponta arredondada vira um pontinho antes da hora
                opacity: { delay: timeAt(startX), duration: 0.05 },
              }}
            />
          </g>
        ))}

        {future.map(({ key, d, branch }) => (
          <g
            key={key}
            className="transition-opacity duration-300"
            opacity={dimmed(branch) ? 0.2 : 1}
          >
            <motion.path
              d={d}
              fill="none"
              stroke={colorOf(branch)}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="3 6"
              initial={{ opacity: 0 }}
              animate={shown ? { opacity: 0.55 } : {}}
              transition={{ delay: sweep, duration: 0.6 }}
            />
          </g>
        ))}

        {/* anel do commit escolhido: desliza de um nó para o outro */}
        {active && (
          <motion.circle
            r={11}
            fill="none"
            stroke={colorOf(active.branch)}
            strokeWidth={1.5}
            initial={{ cx: xOf(active), cy: yOf(active), opacity: 0 }}
            animate={{
              cx: xOf(active),
              cy: yOf(active),
              opacity: shown ? (dimmed(active.branch) ? 0.2 : 0.6) : 0,
            }}
            transition={{
              cx: { type: 'spring', stiffness: 260, damping: 28 },
              cy: { type: 'spring', stiffness: 260, damping: 28 },
              opacity: { delay: shown ? sweep : 0, duration: 0.3 },
            }}
          />
        )}

        {/* commits */}
        {commits.map((commit) => {
          const x = xOf(commit);
          const y = yOf(commit);
          const color = colorOf(commit.branch);
          const isTip = commit.tip;
          const isSelected = selected === commit.id;
          const above = LABEL_ABOVE.has(commit.branch);

          return (
            <motion.g
              key={commit.id}
              role="button"
              tabIndex={0}
              aria-label={commit.title}
              aria-pressed={isSelected}
              data-kess-mood={
                commit.planned ? 'inspiracao' : isTip ? 'animado' : 'curioso'
              }
              onClick={() => onSelect(commit.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(commit.id);
                }
              }}
              className="group cursor-pointer outline-none"
              initial={{ opacity: 0 }}
              animate={shown ? { opacity: 1 } : {}}
              transition={{
                delay: commit.planned ? sweep + 0.3 : timeAt(x),
                duration: 0.35,
              }}
            >
              <g
                className="transition-opacity duration-300"
                opacity={dimmed(commit.branch) ? 0.3 : 1}
              >
                {/* área de clique maior que o nó */}
                <circle cx={x} cy={y} r={18} fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={14}
                  fill="none"
                  stroke="var(--ctp-accent)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  className="opacity-0 transition-opacity group-focus-visible:opacity-100"
                />

                <g
                  className="transition-transform duration-200 group-hover:scale-125 group-focus-visible:scale-125"
                  style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                  }}
                >
                  {commit.planned ? (
                    <circle
                      cx={x}
                      cy={y}
                      r={6}
                      fill="var(--ctp-mantle)"
                      stroke={color}
                      strokeOpacity={0.7}
                      strokeWidth={2}
                      strokeDasharray="3 2.5"
                    />
                  ) : isTip ? (
                    <circle
                      cx={x}
                      cy={y}
                      r={6}
                      fill="var(--ctp-mantle)"
                      stroke={color}
                      strokeWidth={2.5}
                    />
                  ) : (
                    <circle
                      cx={x}
                      cy={y}
                      r={5.5}
                      fill={color}
                      stroke="var(--ctp-mantle)"
                      strokeWidth={2.5}
                    />
                  )}
                </g>

                <text
                  x={x}
                  y={above ? y - 16 : y + 24}
                  textAnchor="middle"
                  fontSize={11}
                  fontStyle={commit.planned ? 'italic' : undefined}
                  className={cn(
                    'transition-colors duration-200',
                    isSelected
                      ? 'fill-ctp-text'
                      : 'fill-ctp-overlay-2 group-hover:fill-ctp-text'
                  )}
                >
                  {commit.label}
                </text>
              </g>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

export default GitTimeline;
