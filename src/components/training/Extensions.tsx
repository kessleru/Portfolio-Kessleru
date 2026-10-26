import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Copy, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { certificates, issuers, type Certificate } from './certificates';

const VISIBLE_CHIPS = 10;

const skillCounts = certificates.reduce((counts, certificate) => {
  certificate.skills.forEach((skill) =>
    counts.set(skill, (counts.get(skill) ?? 0) + 1)
  );
  return counts;
}, new Map<string, number>());

const allSkills = [...skillCounts.entries()].sort(
  ([a, countA], [b, countB]) => countB - countA || a.localeCompare(b, 'pt-BR')
);

const sections = [
  {
    title: 'Em andamento',
    items: certificates.filter((certificate) => certificate.inProgress),
  },
  ...issuers.map((issuer) => ({
    title: issuer,
    items: certificates.filter(
      (certificate) => certificate.issuer === issuer && !certificate.inProgress
    ),
  })),
];

const chipClass = (active: boolean) =>
  cn(
    'flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs whitespace-nowrap transition-colors',
    active
      ? 'border-ctp-accent bg-ctp-surface-0 text-ctp-accent'
      : 'border-ctp-overlay-0/50 text-ctp-subtext-0 hover:border-ctp-subtext-0 hover:text-ctp-text'
  );

type ExtensionCardProps = {
  certificate: Certificate;
  index: number;
  open: boolean;
  onToggle: () => void;
  onSkill: (skill: string) => void;
};

function ExtensionCard({
  certificate,
  index,
  open,
  onToggle,
  onSkill,
}: ExtensionCardProps) {
  const { icon: Icon, color } = certificate;
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  async function copyCredential() {
    if (!certificate.credential) return;
    try {
      await navigator.clipboard.writeText(certificate.credential);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // sem permissão de área de transferência: o código continua visível
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        layout: { type: 'spring', stiffness: 380, damping: 34 },
        default: { duration: 0.35, delay: (index % 9) * 0.05 },
      }}
      className={cn(open && 'sm:col-span-2 xl:col-span-3')}
    >
      <motion.button
        layout="position"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        data-kess-mood={certificate.inProgress ? 'concentrado' : 'inspiracao'}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'group relative flex w-full cursor-pointer items-start gap-3 overflow-hidden rounded-lg border bg-ctp-crust/30 p-3 text-left transition-colors hover:bg-ctp-crust/60',
          open
            ? 'border-ctp-accent/50'
            : 'border-ctp-crust/40 hover:border-ctp-overlay-0/40'
        )}
      >
        <span
          className="grid size-12 shrink-0 place-items-center rounded-lg bg-ctp-crust transition-transform duration-300 group-hover:-translate-y-0.5"
          style={{ color }}
        >
          <Icon size={26} aria-hidden="true" />
        </span>

        <span className="relative min-w-0 flex-1">
          <span className="line-clamp-2 text-sm leading-5 font-semibold text-ctp-text">
            {certificate.name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-ctp-subtext-0">
            {certificate.skills.join(' · ')}
          </span>
          <span className="mt-2 flex items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate text-ctp-subtext-1">
              {certificate.issuer}
              {!certificate.inProgress && (
                <span className="text-ctp-overlay-0">
                  {' '}
                  · {certificate.date}
                </span>
              )}
            </span>
            {certificate.inProgress ? (
              <span className="shrink-0 text-[11px] text-ctp-yellow">
                instalando…
              </span>
            ) : (
              <Settings
                size={14}
                aria-hidden="true"
                className="shrink-0 text-ctp-overlay-0 transition-transform duration-500 group-hover:rotate-90 group-hover:text-ctp-subtext-0"
              />
            )}
          </span>
        </span>

        {certificate.inProgress && (
          <span className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-ctp-crust">
            <motion.span
              className="block h-full w-1/3 bg-ctp-yellow"
              animate={{ x: ['-100%', '300%'] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </span>
        )}
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid gap-4 rounded-lg border border-ctp-crust/60 bg-ctp-mantle p-4 text-xs sm:grid-cols-[1fr_auto] sm:text-sm">
              <div className="min-w-0 space-y-3">
                <p className="text-ctp-subtext-0">
                  {certificate.inProgress
                    ? `Curso em andamento na ${certificate.issuer}.`
                    : `Emitido por ${certificate.issuer} em ${certificate.date}.`}
                </p>
                <div>
                  <p className="mb-2 text-ctp-overlay-1">Competências</p>
                  <ul className="flex flex-wrap gap-2">
                    {certificate.skills.map((skill) => (
                      <li key={skill}>
                        <button
                          type="button"
                          onClick={() => onSkill(skill)}
                          className={chipClass(false)}
                        >
                          {skill}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {certificate.credential && (
                <div className="text-xs sm:text-right">
                  <p className="mb-1 text-ctp-overlay-1">
                    código da credencial
                  </p>
                  <button
                    type="button"
                    onClick={copyCredential}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-ctp-overlay-0/40 px-2 py-1 text-ctp-yellow transition-colors hover:border-ctp-accent"
                  >
                    {certificate.credential}
                    {copied ? (
                      <Check size={14} className="text-ctp-green" />
                    ) : (
                      <Copy size={14} className="text-ctp-subtext-0" />
                    )}
                    <span className="sr-only">
                      {copied ? 'copiado' : 'copiar código'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// Os certificados como o painel de Extensões do VS Code: filtro por competência e seções por emissor.
function Extensions() {
  const [skill, setSkill] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [showAllChips, setShowAllChips] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  // Com a lista recolhida, a competência ativa continua aparecendo mesmo se for das raras.
  const chips = showAllChips
    ? allSkills
    : allSkills.filter(
        ([name], index) => index < VISIBLE_CHIPS || name === skill
      );
  const visible = sections.map((section) => ({
    ...section,
    items: section.items.filter(
      (certificate) => !skill || certificate.skills.includes(skill)
    ),
  }));
  const total = visible.reduce((sum, section) => sum + section.items.length, 0);

  function toggleSection(title: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function pickSkill(next: string | null) {
    setSkill((current) => (current === next ? null : next));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wider text-ctp-subtext-0 uppercase">
          Extensões
        </p>
        <p className="text-xs text-ctp-overlay-1">
          {total} de {certificates.length}
        </p>
      </div>

      <motion.ul layout className="flex flex-wrap gap-2">
        <li>
          <button
            type="button"
            onClick={() => setSkill(null)}
            className={chipClass(skill === null)}
          >
            Todas
          </button>
        </li>
        {chips.map(([name, count]) => (
          <motion.li layout key={name}>
            <button
              type="button"
              onClick={() => pickSkill(name)}
              aria-pressed={skill === name}
              data-kess-mood="curioso"
              className={chipClass(skill === name)}
            >
              {name}
              <span className="text-[10px] text-ctp-overlay-1">{count}</span>
            </button>
          </motion.li>
        ))}
        {allSkills.length > VISIBLE_CHIPS && (
          <motion.li layout>
            <button
              type="button"
              onClick={() => setShowAllChips((current) => !current)}
              className="cursor-pointer px-1 py-1 text-xs text-ctp-accent hover:underline"
            >
              {showAllChips
                ? 'mostrar menos'
                : `+${allSkills.length - chips.length} competências`}
            </button>
          </motion.li>
        )}
      </motion.ul>

      {visible.map(
        (section) =>
          section.items.length > 0 && (
            <motion.section layout key={section.title} className="space-y-3">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                aria-expanded={!collapsed.has(section.title)}
                className="flex w-full cursor-pointer items-center gap-2 border-t border-ctp-crust/60 pt-3 text-xs font-semibold tracking-wider text-ctp-subtext-1 uppercase hover:text-ctp-text"
              >
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={cn(
                    'transition-transform duration-200',
                    collapsed.has(section.title) && '-rotate-90'
                  )}
                />
                {section.title}
                <span className="rounded bg-ctp-surface-0 px-1.5 text-[10px] text-ctp-subtext-0">
                  {section.items.length}
                </span>
              </button>

              {!collapsed.has(section.title) && (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {section.items.map((certificate, index) => (
                      <ExtensionCard
                        key={certificate.id}
                        certificate={certificate}
                        index={index}
                        open={open === certificate.id}
                        onToggle={() =>
                          setOpen((current) =>
                            current === certificate.id ? null : certificate.id
                          )
                        }
                        onSkill={setSkill}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </motion.section>
          )
      )}
    </div>
  );
}

export default Extensions;
