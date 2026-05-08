import React from 'react';
import PlayerLeaderboards from '@/components/sections/PlayerLeaderboards';
import { motion } from 'framer-motion';

export const revalidate = 60; // refresh every minute

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
    <div className='relative min-h-screen pt-24 pb-16 overflow-hidden'>
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-12'>
          <h1 className='text-4xl md:text-5xl font-black mb-4 tracking-tight'>
            <span className='text-gradient bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]'>
              Player Leaderboards
            </span>
          </h1>
          <p className='text-slate-400 text-lg max-w-2xl'>Explore the top performing batsmen and bowlers of the tournament.</p>
        </div>

        <PlayerLeaderboards topBatsmen={data.topBatsmen} topBowlers={data.topBowlers} />
      </div>
    </div>
  );
}
