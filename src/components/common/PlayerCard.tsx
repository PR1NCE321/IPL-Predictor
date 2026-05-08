import React from 'react';
import { PlayerLeaderboardEntry } from '@/types';

interface Props {
  entry: PlayerLeaderboardEntry;
}

export default function PlayerCard({ entry }: Props) {
  return (
    <div className="panel-sheen rounded-3xl border border-white/10 bg-slate-950/50 p-4 shadow-xl transition-transform hover:-translate-y-1 w-full">
      <div className="text-base font-bold text-white">{entry.name}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{entry.team} • {entry.metric}</div>
      <div className="mt-4 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-violet-400">{entry.value}</div>
    </div>
  );
}
