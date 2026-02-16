import { type ComponentType, type ReactNode } from 'react';
import TextType from '@/components/react-bits/text-type/TextType';
import Card from '@/components/ui/Cards/Card';

type ProfileTextTypeProps = {
  as?: string;
  className?: string;
  text: string;
  typingSpeed?: number;
  showCursor?: boolean;
  loop?: boolean;
  cursorBlinkDuration?: number;
  variableSpeed?: { min: number; max: number };
  renderText?: (text: string) => ReactNode;
};

const TypedTextType =
  TextType as unknown as ComponentType<ProfileTextTypeProps>;

function highlightCode(text: string): ReactNode {
  const tokenizeCode = (code: string) => {
    const tokens: { text: string; className?: string }[] = [];
    let remaining = code;

    while (remaining.length > 0) {
      let match: RegExpMatchArray | null;

      if ((match = remaining.match(/^(?:const|let|var|function|return)\b/))) {
        tokens.push({ text: match[0], className: 'text-ctp-mauve' });
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(/^'[^']*'?/))) {
        tokens.push({ text: match[0], className: 'text-ctp-green' });
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(/^\d+/))) {
        tokens.push({ text: match[0], className: 'text-ctp-yellow' });
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(/^[{}]/))) {
        tokens.push({ text: match[0], className: 'text-ctp-maroon' });
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(/^:/))) {
        tokens.push({ text: match[0], className: 'text-ctp-green' });
        remaining = remaining.slice(match[0].length);
      } else if ((match = remaining.match(/^[,;]/))) {
        tokens.push({ text: match[0], className: 'text-ctp-subtext-0/75' });
        remaining = remaining.slice(match[0].length);
      } else {
        const last = tokens[tokens.length - 1];
        if (last && !last.className) {
          last.text += remaining[0];
        } else {
          tokens.push({ text: remaining[0] });
        }
        remaining = remaining.slice(1);
      }
    }

    return tokens;
  };

  const lines = text.split('\n');
  const output: ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const lineMatch = line.match(/^(\s*\d+)(\s*)(.*)$/);

    if (lineMatch) {
      output.push(
        <span key={`ln-${lineIndex}`} className="mr-4 text-ctp-subtext-0/50">
          {lineMatch[1]}
        </span>
      );
      output.push(lineMatch[2]);

      const codeTokens = tokenizeCode(lineMatch[3]);
      codeTokens.forEach((token, tokenIndex) => {
        output.push(
          token.className ? (
            <span
              key={`tk-${lineIndex}-${tokenIndex}`}
              className={token.className}
            >
              {token.text}
            </span>
          ) : (
            <span key={`tx-${lineIndex}-${tokenIndex}`}>{token.text}</span>
          )
        );
      });
    } else {
      const codeTokens = tokenizeCode(line);
      codeTokens.forEach((token, tokenIndex) => {
        output.push(
          token.className ? (
            <span
              key={`tk-${lineIndex}-${tokenIndex}`}
              className={token.className}
            >
              {token.text}
            </span>
          ) : (
            <span key={`tx-${lineIndex}-${tokenIndex}`}>{token.text}</span>
          )
        );
      });
    }

    if (lineIndex < lines.length - 1) {
      output.push('\n');
    }
  });

  return output;
}

function ProfileCard() {
  return (
    <Card fileName="Profile.tsx" className="w-full justify-self-start">
      <TypedTextType
        as="pre"
        className="overflow-x-auto text-xs sm:text-[14px] leading-relaxed text-ctp-code"
        text={` 1 const pessoa = {\n 2   nome: 'Otávio Kessler Ustra',\n 3   idade: 20,\n 4   localizacao: 'Ituiutaba, MG - Brasil',\n 5   formacao: {\n 6     curso: 'Ciência da Computação',\n 7     instituicao: 'IFTM Ituiutaba',\n 8     status: 'Em andamento',\n 9   },\n10 };`}
        typingSpeed={20}
        showCursor={false}
        loop={false}
        cursorBlinkDuration={0}
        variableSpeed={{ min: 15, max: 40 }}
        renderText={highlightCode}
      />
    </Card>
  );
}

export default ProfileCard;
