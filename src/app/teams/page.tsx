'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { teamInfo } from '@/data/mockData';
import { Trophy, Activity, Target, ArrowRight, CalendarDays } from 'lucide-react';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';
import { useCountUp } from '@/hooks/useCountUp';

function AnimatedNum({ value }: { value: number }) {
  const v = useCountUp(value, 800, 0);
  return <>{v}</>;
}

function getPlayoffState(qualificationChance: number | undefined, rank: number) {
  const chance = qualificationChance ?? 0;
  if (rank <= 4 && chance >= 80) return { label: 'Safely in control', color: '#1D9E75' };
  if (rank <= 4 && chance >= 55) return { label: 'Playoff push', color: '#1D9E75' };
  if (rank <= 4) return { label: 'Top-four battle', color: '#D4AF37' };
  if (chance >= 35) return { label: 'Still alive', color: '#D4AF37' };
  return { label: 'Must-win stretch', color: '#E8003D' };
}

export default function TeamsPage() {
  const { pointsTable: currentPointsTable, matches, loading, error } = useLiveSystemData();

  if (loading || !currentPointsTable) {
    return (
      <div className='min-h-screen p-8'>
        <div className='max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4'>
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className='skeleton h-64 w-full' />)}
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen p-6 md:p-8'>
      <div className='max-w-6xl mx-auto'>
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className='mb-8'
        >
          <p className='section-label mb-2'>IPL 2026</p>
          <h1 className='text-4xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>
            FRANCHISE INTELLIGENCE
          </h1>
          <p style={{ color: '#8890A0', marginTop: 8, fontSize: 14 }}>All 10 franchises — stats, form, and qualification outlook.</p>
          {error && <p className='mt-2 text-xs' style={{ color: '#E8003D' }}>Live data unavailable.</p>}
        </motion.div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
          {Object.values(teamInfo).map((team, idx) => {
            const stats = currentPointsTable.find(t => t.team === team.shortName);
            const rank = currentPointsTable.findIndex(t => t.team === team.shortName) + 1;
            const playoffState = getPlayoffState(stats?.qualificationChance, rank);

            const teamMatches = matches?.filter(m => m.status === 'completed' && (m.team1 === team.shortName || m.team2 === team.shortName)) || [];
            const formGuide = teamMatches.slice(-5).map(m => m.winner === team.shortName ? 'W' : 'L');

            return (
              <motion.div
                key={team.id}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                className='surface-card p-5 flex flex-col'
                style={{ borderTop: `3px solid ${team.color}` }}
              >
                {/* Team Header */}
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-10 h-10 rounded overflow-hidden' style={{ background: '#1A1D26', padding: 4 }}>
                    <img src={team.logo} alt={team.shortName} className='w-full h-full object-contain'
                      onError={(e) => { (e.target as HTMLImageElement).src = team.fallbackLogo || ''; }} />
                  </div>
                  <div>
                    <p className='font-bold text-sm' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{team.shortName}</p>
                    <p style={{ fontSize: 10, color: '#3D4356' }}>RANK {rank} {rank === 1 && '★'}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className='space-y-2 mb-4 flex-1'>
                  <div className='flex justify-between'>
                    <span style={{ fontSize: 11, color: '#8890A0' }}>W / L</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: '#1D9E75' }}>{stats?.wins || 0}</span>
                      <span style={{ color: '#3D4356' }}> / </span>
                      <span style={{ color: '#E8003D' }}>{stats?.losses || 0}</span>
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span style={{ fontSize: 11, color: '#8890A0' }}>Points</span>
                    <span className='font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{stats?.points || 0}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span style={{ fontSize: 11, color: '#8890A0' }}>Qual %</span>
                    <span className='font-bold' style={{ color: playoffState.color }}>
                      <AnimatedNum value={Math.round(stats?.qualificationChance || 0)} />%
                    </span>
                  </div>
                </div>

                {/* Form */}
                <div className='mb-4'>
                  <p style={{ fontSize: 10, color: '#3D4356', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>FORM</p>
                  <div className='flex gap-1'>
                    {formGuide.length > 0 ? formGuide.map((r, i) => (
                      <div key={i} className='w-5 h-5 rounded flex items-center justify-center' style={{
                        fontSize: 9, fontWeight: 700,
                        background: r === 'W' ? 'rgba(29,158,117,0.15)' : 'rgba(232,0,61,0.1)',
                        color: r === 'W' ? '#1D9E75' : '#E8003D',
                      }}>{r}</div>
                    )) : <span style={{ fontSize: 10, color: '#3D4356' }}>N/A</span>}
                  </div>
                </div>

                {/* Status */}
                <div className='rounded p-2 mb-3' style={{ background: '#0D0F14', border: '1px solid #1E2028' }}>
                  <p style={{ fontSize: 9, color: '#3D4356', letterSpacing: '0.08em', textTransform: 'uppercase' }}>STATUS</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: playoffState.color }}>{playoffState.label}</p>
                </div>

                {/* Captain */}
                {team.captain && (
                  <div className='flex items-center gap-2 mb-3' style={{ borderTop: '1px solid #1E2028', paddingTop: 8 }}>
                    <div className='w-7 h-7 rounded-full overflow-hidden' style={{ border: '1px solid #1E2028' }}>
                      <img src={team.captain.image} alt={team.captain.name} className='w-full h-full object-cover'
                        onError={(e) => { (e.target as HTMLImageElement).src = team.captain?.fallbackImage || ''; }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 9, color: '#3D4356', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CAPTAIN</p>
                      <p style={{ fontSize: 11, color: '#E8E8E8', fontWeight: 600 }}>{team.captain.name}</p>
                    </div>
                  </div>
                )}

                <Link href={`/matches?team=${team.shortName}`} className='flex items-center justify-center gap-1 py-2 rounded text-xs font-semibold' style={{ background: '#1A1D26', border: '1px solid #1E2028', color: '#8890A0' }}>
                  <CalendarDays size={12} /> Fixtures <ArrowRight size={12} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
