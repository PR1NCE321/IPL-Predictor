import React from 'react';
import PlayerLeaderboards from '@/components/sections/PlayerLeaderboards';

export const revalidate = 60;

async function fetchPlayerStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/player-stats`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch player stats');
    return res.json();
  } catch (err) {
    console.error('Failed to load player stats', err);
    return { topBatsmen: [], topBowlers: [] };
  }
}

export default async function PlayersPage() {
  const data = await fetchPlayerStats();

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
        <PlayerLeaderboards topBatsmen={data.topBatsmen} topBowlers={data.topBowlers} />
      </div>
    </div>
  );
}
