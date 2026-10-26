import { useEffect, useMemo, useRef, useState } from 'react';
import Card from '@/components/ui/Cards/Card';
import { cn } from '@/lib/utils';
import { kessEvent } from '@/components/kess/kessPreference';

const CODE = [
  'const pessoa = {',
  "  nome: 'Otávio Kessler Ustra',",
  "  cargo: 'Dev Full Stack Júnior',",
  '  idade: 20,',
  "  local: 'Ituiutaba, MG - Brasil',",
  "  atualmente: ['SAE', 'PET Computação'],",
  '  formacao: {',
  "    curso: 'Ciência da Computação',",
  "    instituicao: 'IFTM Ituiutaba',",
  "    status: 'Em andamento',",
  '  },',
  '};',
];

type Token = { text: string; className?: string };

// Cores de colchete por profundidade, como o "bracket pair colorization" do VS Code.
const BRACKETS = ['text-ctp-yellow', 'text-ctp-pink', 'text-ctp-sapphire'];

function tokenize(lines: string[]) {
  let depth = 0;

  return lines.map((line) => {
    const tokens: Token[] = [];
    let rest = line;
    const push = (text: string, className?: string) => {
      const last = tokens[tokens.length - 1];
      if (last && last.className === className) last.text += text;
      else tokens.push({ text, className });
    };

    while (rest.length > 0) {
      let match: RegExpMatchArray | null;
      if ((match = rest.match(/^\s+/))) push(match[0]);
      else if ((match = rest.match(/^const\b/)))
        push(match[0], 'text-ctp-mauve');
      else if ((match = rest.match(/^'[^']*'/)))
        push(match[0], 'text-ctp-green');
      else if ((match = rest.match(/^\d+/))) push(match[0], 'text-ctp-peach');
      else if ((match = rest.match(/^[A-Za-zÀ-ú_]\w*(?=:)/)))
        push(match[0], 'text-ctp-lavender');
      else if ((match = rest.match(/^[A-Za-zÀ-ú_]\w*/)))
        push(match[0], 'text-ctp-text');
      else if ((match = rest.match(/^[{[]/))) {
        push(match[0], BRACKETS[depth % BRACKETS.length]);
        depth += 1;
      } else if ((match = rest.match(/^[}\]]/))) {
        depth -= 1;
        push(match[0], BRACKETS[depth % BRACKETS.length]);
      } else if ((match = rest.match(/^=/))) push(match[0], 'text-ctp-sky');
      else {
        match = [rest[0]];
        push(rest[0], 'text-ctp-overlay-2');
      }
      rest = rest.slice(match[0].length);
    }

    return tokens;
  });
}

const indentOf = (line: string) => line.match(/^ */)![0].length;

// Quanto esperar antes de digitar o caractere seguinte: um ritmo humano, com pausa no fim da linha.
function delayAfter(char: string | undefined) {
  if (char === undefined) return 130;
  if (char === '{' || char === '[') return 110;
  if (char === ',' || char === ';') return 55;
  return 7 + Math.random() * 16;
}

function ProfileCard() {
  const lines = useMemo(() => tokenize(CODE), []);
  const rootRef = useRef<HTMLPreElement>(null);
  // Com "reduzir movimento" o código já começa digitado.
  const [reduce] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [line, setLine] = useState(reduce ? CODE.length - 1 : 0);
  const [column, setColumn] = useState(
    reduce ? CODE[CODE.length - 1].length : 0
  );
  const [done, setDone] = useState(reduce);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) return;

    let timer = 0;
    let row = 0;
    let col = 0;

    function step() {
      const text = CODE[row];
      if (col < text.length) {
        // o editor indenta sozinho: os espaços do começo aparecem de uma vez
        if (col === 0) col = indentOf(text);
        col += 1;
        setColumn(col);
        timer = window.setTimeout(step, delayAfter(text[col - 1]));
      } else if (row < CODE.length - 1) {
        row += 1;
        col = 0;
        setLine(row);
        setColumn(0);
        timer = window.setTimeout(step, delayAfter(undefined));
      } else {
        setDone(true);
        kessEvent({ emote: 'sparkle' });
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timer = window.setTimeout(step, 450);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [reduce]);

  const active = done && hovered !== null ? hovered : line;

  return (
    <Card fileName="Profile.tsx" className="w-full justify-self-start">
      <pre
        ref={rootRef}
        aria-label={CODE.join('\n')}
        onMouseLeave={() => setHovered(null)}
        className="-mx-4 overflow-x-auto py-1 text-xs leading-relaxed sm:text-[14px]"
      >
        {lines.map((tokens, row) => {
          const typed = row < line ? Infinity : row === line ? column : 0;
          const isActive = row === active;
          // guias de indentação só nas linhas que já foram escritas
          const levels = row <= line ? Math.floor(indentOf(CODE[row]) / 2) : 0;
          let offset = 0;

          return (
            <div
              key={row}
              onMouseEnter={() => setHovered(row)}
              className={cn(
                'relative flex pr-4 transition-colors duration-200',
                isActive ? 'bg-ctp-surface-0/40' : 'bg-transparent'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'w-[5ch] shrink-0 pr-[2ch] text-right tabular-nums transition-colors duration-200 select-none',
                  isActive ? 'text-ctp-text' : 'text-ctp-overlay-0'
                )}
              >
                {row + 1}
              </span>

              <code className="relative">
                {/* guias de indentação */}
                {Array.from({ length: levels }, (_, level) => (
                  <span
                    key={level}
                    aria-hidden="true"
                    className="absolute inset-y-0 w-px bg-ctp-surface-1/70"
                    style={{ left: `${level * 2}ch` }}
                  />
                ))}

                {tokens.map((token, index) => {
                  const start = offset;
                  offset += token.text.length;
                  const shown = Math.max(
                    0,
                    Math.min(token.text.length, typed - start)
                  );

                  return (
                    <span key={index} className={token.className}>
                      {token.text.slice(0, shown)}
                      {row === line &&
                        !done &&
                        start + shown === column &&
                        shown < token.text.length && <Caret />}
                      <span className="opacity-0">
                        {token.text.slice(shown)}
                      </span>
                    </span>
                  );
                })}
                {row === line && (column >= CODE[row].length || done) && (
                  <Caret blink={done} />
                )}
              </code>
            </div>
          );
        })}
      </pre>
    </Card>
  );
}

function Caret({ blink = false }: { blink?: boolean }) {
  return (
    <span aria-hidden="true" className="relative">
      <span
        className={cn(
          'absolute top-[0.2em] -left-px h-[1.15em] w-[2px] rounded-full bg-ctp-accent',
          blink && 'cursor-blink'
        )}
      />
    </span>
  );
}

export default ProfileCard;
