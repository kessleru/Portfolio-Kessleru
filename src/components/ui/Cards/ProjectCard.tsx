import { Tag } from 'lucide-react';
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

  return (
    <Card fileName={fileName} className={cn('w-full', className)}>
      <article className="space-y-4">
        <img
          src={img}
          alt={imgAlt}
          className="h-44 w-full rounded-md border border-ctp-crust/30 object-cover"
          loading="lazy"
        />

        <div>
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
                className="rounded-md border border-ctp-crust/30 bg-ctp-crust/40 px-2 py-1 text-xs text-ctp-text"
              >
                {stack}
              </li>
            ))}
          </ul>
        </div>

        {(repoUrl || liveUrl) && (
          <div className="flex items-center gap-4 text-sm">
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-ctp-accent hover:underline underline-offset-4"
              >
                Repositório
              </a>
            )}
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-ctp-accent hover:underline underline-offset-4"
              >
                Demo
              </a>
            )}
          </div>
        )}
      </article>
    </Card>
  );
}

export default ProjectCard;
