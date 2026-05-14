'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';
import { useCountUp } from '@/hooks/useCountUp';
import { teamInfo } from '@/data/mockData';

function StatNumber({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const animated = useCountUp(value, 800, decimals);
  return <>{animated}{suffix}</>;
}

export default function HomePage() {
  const { pointsTable, matches, loading } = useLiveSystemData();

  if (loading || !pointsTable || !matches) {
    return (
      <div className='min-h-screen p-8'>
        <div className='max-w-6xl mx-auto space-y-3'>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className='skeleton h-14 w-full' />
          ))}
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayMatch = matches.find(m => m.date === today && m.status !== 'completed');
  const nextMatch = matches.find(m => m.status === 'pending') || null;
  const recentCompleted = matches.filter(m => m.status === 'completed').slice(-3).reverse();

  return (
    <div className='min-h-screen p-3 md:p-8'>
      <div className='max-w-6xl mx-auto'>

        {/* ── HEADER ── */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className='mb-10'
        >
          <p className='section-label mb-2'>IPL 2026 DASHBOARD</p>
          <h1
            className='text-4xl md:text-5xl font-bold tracking-tight'
            style={{ fontFamily: 'var(--font-barlow), Barlow Condensed, sans-serif', color: '#E8E8E8' }}
          >
            PLAYOFF PREDICTOR
          </h1>
          <p style={{ color: '#8890A0', marginTop: 8, fontSize: 15 }}>
            Real-time standings, Monte Carlo simulations, live match tracking.
          </p>
        </motion.div>

        {/* ── TOP ROW: Today's Match + Quick Stats ── */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8'>
          {/* Today's / Next Match */}
          <div className='lg:col-span-2'>
            {(todayMatch || nextMatch) && (() => {
              const m = todayMatch || nextMatch!;
              const t1 = teamInfo[m.team1];
              const t2 = teamInfo[m.team2];
              const isToday = m.date === today;
              return (
                <div className={`match-card p-6 h-full ${isToday ? 'match-today' : ''}`}>
                  <div className='flex items-center justify-between mb-5'>
                    <p className='section-label'>{isToday ? "TODAY'S MATCH" : 'NEXT MATCH'}</p>
                    {isToday && <span className='live-badge'><span className='live-dot' /> LIVE TODAY</span>}
                    <span style={{ color: '#8890A0', fontSize: 12 }}>Match {m.matchNumber}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    {/* Team 1 — Captain + Logo */}
                    <div className='flex flex-col items-center gap-2 flex-1'>
                      <div className='w-16 h-16 rounded-full overflow-hidden border-2' style={{ borderColor: t1.color, background: '#0D0F14' }}>
                        <img src={t1.captain?.image} alt={t1.captain?.name} className='w-full h-full object-cover'
                          onError={(e) => { (e.target as HTMLImageElement).src = t1.captain?.fallbackImage || ''; }} />
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-6 h-6 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 2 }}>
                          <img src={t1.logo} alt={t1.shortName} className='w-full h-full object-contain' />
                        </div>
                        <span className='font-bold text-lg' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{t1.shortName}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#3D4356' }}>{t1.captain?.name}</span>
                    </div>

                    {/* VS */}
                    <div className='flex flex-col items-center px-4'>
                      <span className='text-2xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#1E2028' }}>VS</span>
                    </div>

                    {/* Team 2 — Captain + Logo */}
                    <div className='flex flex-col items-center gap-2 flex-1'>
                      <div className='w-16 h-16 rounded-full overflow-hidden border-2' style={{ borderColor: t2.color, background: '#0D0F14' }}>
                        <img src={t2.captain?.image} alt={t2.captain?.name} className='w-full h-full object-cover'
                          onError={(e) => { (e.target as HTMLImageElement).src = t2.captain?.fallbackImage || ''; }} />
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='font-bold text-lg' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{t2.shortName}</span>
                        <div className='w-6 h-6 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 2 }}>
                          <img src={t2.logo} alt={t2.shortName} className='w-full h-full object-contain' />
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: '#3D4356' }}>{t2.captain?.name}</span>
                    </div>
                  </div>
                  <div className='flex gap-3 mt-4 justify-center' style={{ color: '#8890A0', fontSize: 12 }}>
                    <span className='flex items-center gap-1'><Calendar size={12} /> {m.date}</span>
                    <span className='flex items-center gap-1'><MapPin size={12} /> {m.venue.split(',')[0]}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quick Stats */}
          <div className='surface-card p-6'>
            <p className='section-label mb-4'>SEASON OVERVIEW</p>
            <div className='space-y-4'>
              <div>
                <p style={{ color: '#8890A0', fontSize: 12 }}>Matches Completed</p>
                <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)' }}>
                  <StatNumber value={matches.filter(m => m.status === 'completed').length} /> <span style={{ color: '#3D4356', fontSize: 16 }}>/ 70</span>
                </p>
              </div>
              <div>
                <p style={{ color: '#8890A0', fontSize: 12 }}>Remaining</p>
                <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)' }}>
                  <StatNumber value={matches.filter(m => m.status === 'pending').length} />
                </p>
              </div>
              <Link href='/simulator' className='block'>
                <button className='btn-simulate mt-2'>OPEN SIMULATOR</button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── POINTS TABLE ── */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <p className='section-label'>STANDINGS AFTER MATCH {matches.filter(m => m.status === 'completed').length}</p>
            <Link href='/analytics' className='flex items-center gap-1' style={{ color: '#D4AF37', fontSize: 12, fontWeight: 600 }}>
              Full Analytics <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
           <div style={{ minWidth: 600 }}>
            {/* Table Header */}
            <div className='grid grid-cols-12 gap-2 px-4 py-3' style={{ borderBottom: '1px solid #1E2028', color: '#3D4356', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              <div className='col-span-1'>#</div>
              <div className='col-span-3'>Team</div>
              <div className='col-span-1 text-center'>M</div>
              <div className='col-span-1 text-center'>W</div>
              <div className='col-span-1 text-center'>L</div>
              <div className='col-span-2 text-center'>NRR</div>
              <div className='col-span-1 text-center'>Pts</div>
              <div className='col-span-2 text-center'>Qual %</div>
            </div>

            {/* Table Rows */}
            {pointsTable.map((entry, idx) => {
              const rank = idx + 1;
              const isTop1 = rank === 1;
              const isQualify = rank <= 4;
              const isEliminated = rank >= 9;
              const team = teamInfo[entry.team];

              return (
                <motion.div
                  key={entry.team}
                  layout
                  layoutId={`pt-row-${entry.team}`}
                  className={`relative grid grid-cols-12 gap-2 px-4 py-3 pt-row ${isTop1 ? 'pt-row-gold' : isQualify ? 'pt-row-qualify' : ''} ${isEliminated ? 'pt-row-eliminated' : ''}`}
                  style={{ borderBottom: '1px solid #1E2028' }}
                >
                  {/* Ghost rank */}
                  <span className='ghost-rank'>{rank}</span>

                  <div className='col-span-1 flex items-center'>
                    <span style={{ color: '#3D4356', fontSize: 13, fontWeight: 700 }}>{rank}</span>
                  </div>
                  <div className='col-span-3 flex items-center gap-2'>
                    <div className='w-5 h-5 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 2 }}>
                      <img src={team.logo} alt={entry.team} className='w-full h-full object-contain' onError={(e) => { (e.target as HTMLImageElement).src = team.fallbackLogo || ''; }} />
                    </div>
                    <span className='font-bold text-sm' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{entry.team}</span>
                  </div>
                  <div className='col-span-1 text-center text-sm' style={{ color: '#8890A0' }}>{entry.matches}</div>
                  <div className='col-span-1 text-center text-sm font-semibold' style={{ color: '#E8E8E8' }}>{entry.wins}</div>
                  <div className='col-span-1 text-center text-sm' style={{ color: '#8890A0' }}>{entry.losses}</div>
                  <div className={`col-span-2 text-center text-sm font-semibold ${entry.nrr >= 0 ? 'nrr-positive' : 'nrr-negative'}`}>
                    {entry.nrr >= 0 ? '+' : ''}{entry.nrr.toFixed(3)}
                  </div>
                  <div className='col-span-1 text-center text-lg font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>
                    <StatNumber value={entry.points} />
                  </div>
                  <div className='col-span-2 text-center text-sm font-semibold' style={{ color: isQualify ? '#1D9E75' : '#8890A0' }}>
                    <StatNumber value={entry.qualificationChance} suffix='%' />
                  </div>

                  {/* Cutoff line after 4th */}
                  {rank === 4 && (
                    <motion.div
                      className='cutoff-line absolute bottom-0 left-0 right-0'
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    />
                  )}
                </motion.div>
              );
            })}
           </div>
          </div>
        </div>

        {/* ── RECENT RESULTS ── */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <p className='section-label'>RECENT RESULTS</p>
            <Link href='/matches' className='flex items-center gap-1' style={{ color: '#D4AF37', fontSize: 12, fontWeight: 600 }}>
              All Matches <ChevronRight size={14} />
            </Link>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {recentCompleted.map((m) => {
              const t1 = teamInfo[m.team1];
              const t2 = teamInfo[m.team2];
              const isT1Winner = m.winner === m.team1;
              return (
                <motion.div
                  key={m.id}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className='match-card p-5'
                >
                  <div className='flex items-center justify-between mb-3'>
                    <span style={{ color: '#3D4356', fontSize: 11, fontWeight: 600 }}>MATCH {m.matchNumber}</span>
                    <span style={{ color: '#8890A0', fontSize: 11 }}>{m.date}</span>
                  </div>
                  <div className='flex items-center justify-between mb-4'>
                    <span className='team-abbr font-bold' style={{
                      fontFamily: 'var(--font-barlow)',
                      fontSize: 20,
                      color: isT1Winner ? '#D4AF37' : '#3D4356'
                    }}>{m.team1}</span>
                    <span style={{ color: '#3D4356', fontSize: 12, fontWeight: 700 }}>VS</span>
                    <span className='team-abbr font-bold' style={{
                      fontFamily: 'var(--font-barlow)',
                      fontSize: 20,
                      color: !isT1Winner ? '#D4AF37' : '#3D4356'
                    }}>{m.team2}</span>
                  </div>
                  {m.winner ? (
                    <div className='text-center py-2 rounded' style={{ background: 'rgba(29, 158, 117, 0.08)', border: '1px solid rgba(29, 158, 117, 0.15)' }}>
                      <span style={{ color: '#1D9E75', fontSize: 12, fontWeight: 600 }}>
                        {m.winner} won{m.margin ? ` by ${m.margin} ${m.marginType || 'runs'}` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className='text-center py-2 rounded' style={{ background: 'rgba(136, 144, 160, 0.08)', border: '1px solid rgba(136, 144, 160, 0.15)' }}>
                      <span style={{ color: '#8890A0', fontSize: 12, fontWeight: 600 }}>No Result</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
