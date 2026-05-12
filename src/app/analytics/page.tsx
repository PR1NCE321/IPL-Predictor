'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { teamInfo } from '@/data/mockData';
import { CheckCircle2, Activity } from 'lucide-react';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';
import { useCountUp } from '@/hooks/useCountUp';

function AnimatedPercent({ value }: { value: number }) {
  const v = useCountUp(value, 800, 1);
  return <>{v}%</>;
}

export default function AnalyticsPage() {
  const { matches, pointsTable: sortedTable, loading, error } = useLiveSystemData();
  const [mcProbabilities, setMcProbabilities] = useState<Record<string, number>>({});
  const [isSimulating, setIsSimulating] = useState(true);

  useEffect(() => {
    if (!matches || !sortedTable) return;
    const pendingMatches = matches.filter(m => m.status === 'pending');
    if (pendingMatches.length === 0) {
      const finalProbs: Record<string, number> = {};
      sortedTable.forEach((t, idx) => finalProbs[t.team] = idx < 4 ? 100 : 0);
      setMcProbabilities(finalProbs);
      setIsSimulating(false);
      return;
    }
    setIsSimulating(true);
    setTimeout(() => {
      const NUM_SIMS = 10000;
      const qualifyCount: Record<string, number> = {};
      sortedTable.forEach(t => qualifyCount[t.team] = 0);
      for (let i = 0; i < NUM_SIMS; i++) {
        const simPoints: Record<string, number> = {};
        sortedTable.forEach(t => simPoints[t.team] = t.points);
        for (const m of pendingMatches) {
          const winner = Math.random() > 0.5 ? m.team1 : m.team2;
          simPoints[winner] += 2;
        }
        const simTable = sortedTable.map(t => ({ team: t.team, pts: simPoints[t.team], nrr: t.nrr }))
          .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.nrr - a.nrr);
        for (let j = 0; j < 4; j++) qualifyCount[simTable[j].team] += 1;
      }
      const finalProbs: Record<string, number> = {};
      for (const team in qualifyCount) finalProbs[team] = (qualifyCount[team] / NUM_SIMS) * 100;
      setMcProbabilities(finalProbs);
      setIsSimulating(false);
    }, 100);
  }, [matches, sortedTable]);

  if (loading || !sortedTable) {
    return (
      <div className='min-h-screen p-8'>
        <div className='max-w-5xl mx-auto space-y-3'>
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className='skeleton h-14 w-full' />)}
        </div>
      </div>
    );
  }

  const completed = matches?.filter(m => m.status === 'completed').length || 0;

  return (
    <div className='min-h-screen p-6 md:p-8'>
      <div className='max-w-5xl mx-auto'>
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className='mb-8'
        >
          <p className='section-label mb-2'>IPL 2026</p>
          <h1 className='text-4xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>
            ANALYTICS DASHBOARD
          </h1>
          <div className='flex items-center gap-3 mt-3'>
            {isSimulating ? (
              <span className='flex items-center gap-2 text-xs font-semibold' style={{ color: '#D4AF37' }}>
                <Activity size={14} className='animate-pulse' /> Running 10,000 simulations...
              </span>
            ) : (
              <span className='flex items-center gap-2 text-xs font-semibold' style={{ color: '#1D9E75' }}>
                <CheckCircle2 size={14} /> Probabilities computed
              </span>
            )}
          </div>
          {error && <p className='mt-2 text-xs' style={{ color: '#E8003D' }}>Live data unavailable.</p>}
        </motion.div>

        {/* ── QUALIFICATION TABLE ── */}
        <div className='mb-10'>
          <p className='section-label mb-4'>QUALIFICATION PROBABILITIES — MONTE CARLO</p>
          <div className='surface-card overflow-hidden'>
            {/* Header */}
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

            {sortedTable.map((entry, idx) => {
              const rank = idx + 1;
              const isTop1 = rank === 1;
              const isQualify = rank <= 4;
              const isEliminated = rank >= 9;
              const team = teamInfo[entry.team];
              const chance = isSimulating ? 0 : (mcProbabilities[entry.team] || 0);

              return (
                <motion.div
                  key={entry.team}
                  layout
                  layoutId={`analytics-row-${entry.team}`}
                  className={`relative grid grid-cols-12 gap-2 px-4 py-3 pt-row ${isTop1 ? 'pt-row-gold' : isQualify ? 'pt-row-qualify' : ''} ${isEliminated ? 'pt-row-eliminated' : ''}`}
                  style={{ borderBottom: '1px solid #1E2028' }}
                >
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
                    {entry.points}
                  </div>
                  <div className='col-span-2 text-center'>
                    <div className='flex items-center justify-center gap-2'>
                      <div className='w-16 h-2 rounded' style={{ background: '#1A1D26' }}>
                        <motion.div
                          className='h-full rounded'
                          initial={{ width: 0 }}
                          animate={{ width: `${chance}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          style={{ background: chance > 50 ? '#1D9E75' : chance > 10 ? '#D4AF37' : '#E8003D' }}
                        />
                      </div>
                      <span className='text-sm font-bold' style={{ color: chance > 50 ? '#1D9E75' : chance > 10 ? '#D4AF37' : '#E8003D', minWidth: 42 }}>
                        {isSimulating ? '...' : <AnimatedPercent value={chance} />}
                      </span>
                    </div>
                  </div>
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

        {/* ── TEAM PROBABILITY CARDS ── */}
        <div>
          <p className='section-label mb-4'>TEAM QUALIFICATION OUTLOOK</p>
          <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
            {sortedTable.map((entry, idx) => {
              const team = teamInfo[entry.team];
              const chance = isSimulating ? 0 : (mcProbabilities[entry.team] || 0);
              const isQualify = idx < 4;
              return (
                <motion.div
                  key={entry.team}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className='surface-card p-4 text-center'
                  style={{ borderLeft: `3px solid ${team.color}` }}
                >
                  <div className='flex items-center justify-center gap-2 mb-2'>
                    <div className='w-5 h-5 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 2 }}>
                      <img src={team.logo} alt={entry.team} className='w-full h-full object-contain' onError={(e) => { (e.target as HTMLImageElement).src = team.fallbackLogo || ''; }} />
                    </div>
                    <span className='font-bold text-sm' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{entry.team}</span>
                  </div>
                  <div className='text-2xl font-bold' style={{
                    fontFamily: 'var(--font-barlow)',
                    color: chance > 50 ? '#1D9E75' : chance > 10 ? '#D4AF37' : '#E8003D'
                  }}>
                    {isSimulating ? '...' : <AnimatedPercent value={chance} />}
                  </div>
                  <p style={{ fontSize: 10, color: '#3D4356', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {chance >= 99 ? 'QUALIFIED' : chance <= 1 ? 'ELIMINATED' : 'IN RACE'}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── KEY INSIGHTS ── */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-10'>
          <div className='surface-card p-6'>
            <p className='section-label mb-2'>PLAYOFF LEADER</p>
            <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#D4AF37' }}>{sortedTable[0].team}</p>
            <p style={{ color: '#8890A0', fontSize: 12, marginTop: 4 }}>
              {isSimulating ? '...' : `${(mcProbabilities[sortedTable[0].team] || 0).toFixed(1)}% chance`}
            </p>
          </div>
          <div className='surface-card p-6'>
            <p className='section-label mb-2'>TEAMS IN CONTENTION</p>
            <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>
              {sortedTable.filter(t => { const c = mcProbabilities[t.team] || 0; return c > 0 && c < 100; }).length}
            </p>
            <p style={{ color: '#8890A0', fontSize: 12, marginTop: 4 }}>Still fighting for top 4</p>
          </div>
          <div className='surface-card p-6'>
            <p className='section-label mb-2'>SIMULATIONS</p>
            <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>10,000</p>
            <p style={{ color: '#8890A0', fontSize: 12, marginTop: 4 }}>Monte Carlo iterations per refresh</p>
          </div>
        </div>
      </div>
    </div>
  );
}
