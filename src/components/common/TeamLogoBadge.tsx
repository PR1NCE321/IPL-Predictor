'use client';

import type { TeamInfo } from '@/types';

type TeamLogoBadgeProps = {
  team: TeamInfo;
  className?: string;
  imageClassName?: string;
  alt?: string;
};

export function TeamLogoBadge({ team, className = '', imageClassName = '', alt }: TeamLogoBadgeProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/25 via-cyan-300/10 to-transparent opacity-90" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] ring-1 ring-white/10" />
      <div className="relative flex h-full w-full items-center justify-center rounded-[inherit] overflow-hidden">
        <img
          src={team.logo}
          alt={alt || `${team.shortName} Logo`}
          className={imageClassName}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.onerror = null;
            img.src = team.fallbackLogo || `https://ui-avatars.com/api/?name=${team.shortName}&background=random&color=fff`;
          }}
        />
      </div>
    </div>
  );
}