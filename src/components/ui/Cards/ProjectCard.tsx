import { useState } from 'react';
import { Link, Tag } from 'lucide-react';
import Card from '@/components/ui/Cards/Card';
import { cn } from '@/lib/utils';

type ProjectCardProps = {
  title: string;
  description: string;
  img: string;
  imgAlt: string;
  stacks: string[];
  repoUrl?: string;
  liveUrl?: string;
  className?: string;
};

const stackColorClassMap: Record<string, string> = {
  javascript: 'border-ctp-yellow/40 text-ctp-yellow',
  typescript: 'border-ctp-blue/40 text-ctp-blue',
  react: 'border-ctp-sky/40 text-ctp-sky',
  'node.js': 'border-ctp-green/40 text-ctp-green',
  nodejs: 'border-ctp-green/40 text-ctp-green',
  express: 'border-ctp-subtext-1/40 text-ctp-subtext-1',
  html: 'border-ctp-peach/40 text-ctp-peach',
  css: ' border-ctp-sapphire/40 text-ctp-sapphire',
  'tailwind css': 'border-ctp-teal/40 text-ctp-teal',
  vite: 'border-ctp-lavender/40 text-ctp-lavender',
  'react leaflet': 'border-ctp-green/40 text-ctp-green',
};

const getStackBadgeClassName = (stack: string) => {
  const key = stack.trim().toLowerCase();

  return (
    stackColorClassMap[key] ??
    'border-ctp-crust/30 bg-ctp-crust/40 text-ctp-text'
  );
};

function ProjectCard({
  title,
  description,
  img,
  imgAlt,
  stacks,
  repoUrl,
  liveUrl,
  className,
}: ProjectCardProps) {
  const fileName = `${title.replace(/\s+/g, '')}.tsx`;
  const [imageState, setImageState] = useState({
    src: img,
    isLoaded: false,
    hasError: false,
  });

  const isCurrentImage = imageState.src === img;
  const isImageLoaded = isCurrentImage && imageState.isLoaded;
  const hasImageError = isCurrentImage && imageState.hasError;

  return (
    <Card fileName={fileName} className={cn('w-full', className)}>
      <article className="space-y-4">
        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          className="text-ctp-accent hover:underline underline-offset-4"
        >
          <div className="relative overflow-hidden rounded-md border border-ctp-crust/30">
            {(!isImageLoaded || hasImageError) && (
              <div
                className={cn(
                  'aspect-[16/9] w-full bg-ctp-crust/40',
                  !hasImageError && 'animate-pulse'
                )}
                aria-hidden="true"
              />
            )}

            {!hasImageError && (
              <img
                src={img}
                alt={imgAlt}
                className={cn(
                  'aspect-[16/9] w-full object-cover transition-opacity duration-300',
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                loading="lazy"
                fetchPriority="low"
                onLoad={() =>
                  setImageState({ src: img, isLoaded: true, hasError: false })
                }
                onError={() =>
                  setImageState({ src: img, isLoaded: false, hasError: true })
                }
              />
            )}
          </div>
        </a>

        <div className="mt-4">
          <h3 className="text-lg font-bold text-ctp-text">{title}</h3>
          <p className="mt-2 text-sm text-ctp-subtext-0">{description}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-ctp-subtext-0">
            <Tag className="h-4 w-4 text-ctp-accent" aria-hidden="true" />
            <span>Stacks usadas</span>
          </div>

          <ul className="flex flex-wrap gap-2">
            {stacks.map((stack) => (
              <li
                key={stack}
                className={cn(
                  'rounded-md border px-2 py-1 text-xs',
                  getStackBadgeClassName(stack)
                )}
              >
                {stack}
              </li>
            ))}
          </ul>
        </div>

        {(repoUrl || liveUrl) && (
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-ctp-accent" aria-hidden="true" />
            <div className="flex items-center gap-4 text-sm">
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ctp-accent hover:underline underline-offset-4 max-sm:underline"
                >
                  Repositório
                </a>
              )}
              {liveUrl && (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ctp-accent hover:underline underline-offset-4 max-sm:underline"
                >
                  Demo
                </a>
              )}
            </div>
          </div>
        )}
      </article>
    </Card>
  );
}

export default ProjectCard;
