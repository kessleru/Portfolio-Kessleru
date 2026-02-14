import { type ComponentType, type ReactNode } from 'react';
import TextType from '@/components/react-bits/text-type/TextType';
import Card from '@/components/ui/Card';

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
  const tokens: { text: string; className?: string }[] = [];
  let remaining = text;

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

  return tokens.map((token, i) =>
    token.className ? (
      <span key={i} className={token.className}>
        {token.text}
      </span>
    ) : (
      token.text
    )
  );
}

function ProfileCard() {
  return (
    <Card fileName="Profile.tsx" className="w-full justify-self-start">
      <TypedTextType
        as="pre"
        className="overflow-x-auto text-xs sm:text-[14px] leading-relaxed text-ctp-code"
        text={`const pessoa = {\n  nome: 'Otávio Kessler Ustra',\n  idade: 20,\n  localizacao: 'Ituiutaba, MG - Brasil',\n  formacao: {\n    curso: 'Ciência da Computação',\n    instituicao: 'IFTM Ituiutaba',\n    status: 'Em andamento'\n  },\n};`}
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
