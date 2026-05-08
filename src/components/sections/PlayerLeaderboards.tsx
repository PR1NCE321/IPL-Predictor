import React from 'react';
import PlayerCard from '@/components/common/PlayerCard';
import { PlayerLeaderboardEntry } from '@/types';
import { Flame, Target } from 'lucide-react';

interface Props {
  topBatsmen: PlayerLeaderboardEntry[];
  topBowlers: PlayerLeaderboardEntry[];
}

export default function PlayerLeaderboards({ topBatsmen, topBowlers }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Top Batsmen */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none"></div>
        <div className="flex items-center space-x-3 mb-6 relative z-10">
          <div className="p-2 bg-amber-500/20 rounded-lg"><Flame className="w-5 h-5 text-amber-400" /></div>
          <h2 className='text-2xl font-bold text-white'>Top Batsmen</h2>
        </div>
        <div className="flex flex-col gap-4 relative z-10">
          {topBatsmen.map((b) => (
            <PlayerCard key={b.playerId} entry={b} />
          ))}
          {topBatsmen.length === 0 && (
            <p className="text-slate-400 italic">No stats available yet.</p>
          )}
        </div>
      </div>

      {/* Top Bowlers */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full pointer-events-none"></div>
        <div className="flex items-center space-x-3 mb-6 relative z-10">
          <div className="p-2 bg-cyan-500/20 rounded-lg"><Target className="w-5 h-5 text-cyan-400" /></div>
          <h2 className='text-2xl font-bold text-white'>Top Bowlers</h2>
        </div>
        <div className="flex flex-col gap-4 relative z-10">
          {topBowlers.map((b) => (
            <PlayerCard key={b.playerId} entry={b} />
          ))}
          {topBowlers.length === 0 && (
            <p className="text-slate-400 italic">No stats available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
