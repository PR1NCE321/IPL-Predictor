import React from 'react';
import PlayerLeaderboards from '@/components/sections/PlayerLeaderboards';
import { getTopBatsmen, getTopBowlers } from '@/services/playerAnalytics';

export const revalidate = 60;

export default async function PlayersPage() {
  const topBatsmen = getTopBatsmen(10);
  const topBowlers = getTopBowlers(10);

  return (
    <div className='min-h-screen p-6 md:p-8'>
      <div className='max-w-5xl mx-auto'>
        <div className='mb-8'>
          <p className='section-label mb-2'>IPL 2026</p>
          <h1 className='text-4xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>
            PLAYER LEADERBOARDS
          </h1>
          <p style={{ color: '#8890A0', marginTop: 8, fontSize: 14 }}>Top performing batsmen and bowlers of the tournament.</p>
        </div>
        <PlayerLeaderboards topBatsmen={topBatsmen} topBowlers={topBowlers} />
      </div>
    </div>
  );
}
