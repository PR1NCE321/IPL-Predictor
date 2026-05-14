'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { teamInfo } from '@/data/mockData';
import { HeadToHeadStats, Team } from '@/types';
import { useCountUp } from '@/hooks/useCountUp';
import { ArrowLeftRight } from 'lucide-react';

const teams = (Object.keys(teamInfo) as Team[]).filter(k => k !== 'TBD');

function AnimatedNum({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const v = useCountUp(value, 800, decimals);
  return <>{v}</>;
}

export default function HeadToHeadPage() {
  const [team1, setTeam1] = useState<Team>('RCB');
  const [team2, setTeam2] = useState<Team>('MI');
  const [stats, setStats] = useState<HeadToHeadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const t1 = teamInfo[team1], t2 = teamInfo[team2];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/head-to-head?team1=${team1}&team2=${team2}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setStats(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [team1, team2]);

  return (
    <div className='min-h-screen p-6 md:p-8'>
      <div className='max-w-4xl mx-auto'>
        <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className='mb-8'>
          <p className='section-label mb-2'>IPL 2026</p>
          <h1 className='text-4xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>HEAD TO HEAD</h1>
        </motion.div>

        {/* Team Selectors */}
        <div className='flex items-center gap-3 mb-8 flex-wrap'>
          <select value={team1} onChange={(e) => setTeam1(e.target.value as Team)} className='py-2 px-4 rounded text-sm font-bold' style={{ background: '#0D0F14', border: '1px solid #1E2028', color: '#E8E8E8', outline: 'none' }}>
            {teams.map(t => <option key={t} value={t}>{teamInfo[t].name}</option>)}
          </select>
          <button onClick={() => { setTeam1(team2); setTeam2(team1); }} className='p-2 rounded' style={{ background: '#1A1D26', border: '1px solid #1E2028', color: '#8890A0' }}>
            <ArrowLeftRight size={16} />
          </button>
          <select value={team2} onChange={(e) => setTeam2(e.target.value as Team)} className='py-2 px-4 rounded text-sm font-bold' style={{ background: '#0D0F14', border: '1px solid #1E2028', color: '#E8E8E8', outline: 'none' }}>
            {teams.map(t => <option key={t} value={t}>{teamInfo[t].name}</option>)}
          </select>
        </div>

        {loading && <div className='space-y-3'>{Array.from({ length: 4 }).map((_, i) => <div key={i} className='skeleton h-16 w-full' />)}</div>}

        {stats && !loading && (
          <div className='space-y-6'>
            {/* Prediction Header */}
            <div className='surface-card p-6'>
              {/* Captain Duel Header */}
              <div className='flex items-center justify-between mb-6'>
                <div className='flex flex-col items-center gap-2 flex-1'>
                  <div className='w-20 h-20 rounded-full overflow-hidden border-2' style={{ borderColor: t1.color, background: '#0D0F14' }}>
                    <img src={t1.captain?.image} alt={t1.captain?.name} className='w-full h-full object-cover'
                      onError={(e) => { (e.target as HTMLImageElement).src = t1.captain?.fallbackImage || ''; }} />
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-6 h-6 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 2 }}>
                      <img src={t1.logo} alt={team1} className='w-full h-full object-contain' />
                    </div>
                    <span className='text-xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{team1}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#8890A0' }}>{t1.captain?.name}</span>
                </div>
                <div className='flex flex-col items-center px-4'>
                  <span className='text-2xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#1E2028' }}>VS</span>
                </div>
                <div className='flex flex-col items-center gap-2 flex-1'>
                  <div className='w-20 h-20 rounded-full overflow-hidden border-2' style={{ borderColor: t2.color, background: '#0D0F14' }}>
                    <img src={t2.captain?.image} alt={t2.captain?.name} className='w-full h-full object-cover'
                      onError={(e) => { (e.target as HTMLImageElement).src = t2.captain?.fallbackImage || ''; }} />
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{team2}</span>
                    <div className='w-6 h-6 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 2 }}>
                      <img src={t2.logo} alt={team2} className='w-full h-full object-contain' />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#8890A0' }}>{t2.captain?.name}</span>
                </div>
              </div>

              {/* Tug-of-War Bar */}
              <p className='section-label mb-2'>AI WIN PROBABILITY</p>
              <div className='flex justify-between mb-1'>
                <span className='text-lg font-bold' style={{ fontFamily: 'var(--font-barlow)', color: t1.color }}>
                  <AnimatedNum value={stats.aiPrediction?.team1WinProbability || 50} />%
                </span>
                <span className='text-lg font-bold' style={{ fontFamily: 'var(--font-barlow)', color: t2.color }}>
                  <AnimatedNum value={stats.aiPrediction?.team2WinProbability || 50} />%
                </span>
              </div>
              <div className='tug-bar' style={{ height: 12 }}>
                <motion.div
                  initial={{ width: '50%' }}
                  animate={{ width: `${stats.aiPrediction?.team1WinProbability || 50}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  style={{ background: t1.color, borderRadius: '4px 0 0 4px' }}
                />
                <motion.div
                  initial={{ width: '50%' }}
                  animate={{ width: `${stats.aiPrediction?.team2WinProbability || 50}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  style={{ background: t2.color, borderRadius: '0 4px 4px 0' }}
                />
              </div>
              {stats.aiPrediction?.confidence && (
                <div className='flex items-center justify-center mt-3'>
                  <span className='text-xs px-3 py-1 rounded' style={{
                    background: stats.aiPrediction.confidence === 'high' ? 'rgba(29,158,117,0.1)' : 'rgba(212,175,55,0.1)',
                    color: stats.aiPrediction.confidence === 'high' ? '#1D9E75' : '#D4AF37',
                    fontWeight: 700
                  }}>
                    {stats.aiPrediction.confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              <div className='surface-card p-4 text-center'>
                <p className='section-label mb-1'>MEETINGS</p>
                <p className='text-2xl font-bold' style={{ fontFamily: 'var(--font-barlow)' }}><AnimatedNum value={stats.meetings} /></p>
              </div>
              <div className='surface-card p-4 text-center'>
                <p className='section-label mb-1'>{team1} WINS</p>
                <p className='text-2xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: t1.color }}><AnimatedNum value={stats.team1Wins} /></p>
              </div>
              <div className='surface-card p-4 text-center'>
                <p className='section-label mb-1'>{team2} WINS</p>
                <p className='text-2xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: t2.color }}><AnimatedNum value={stats.team2Wins} /></p>
              </div>
              <div className='surface-card p-4 text-center'>
                <p className='section-label mb-1'>LAST WINNER</p>
                <p className='text-2xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#D4AF37' }}>{stats.lastWinner || 'N/A'}</p>
              </div>
            </div>

            {/* Win Rate Bars */}
            <div className='surface-card p-5'>
              <p className='section-label mb-3'>ALL-TIME WIN RATE</p>
              {[{ team: team1, rate: stats.team1WinRate, color: t1.color }, { team: team2, rate: stats.team2WinRate, color: t2.color }].map(x => (
                <div key={x.team} className='mb-3'>
                  <div className='flex justify-between mb-1'>
                    <span style={{ fontSize: 12, color: '#8890A0' }}>{x.team}</span>
                    <span style={{ fontSize: 12, color: '#E8E8E8', fontWeight: 600 }}>{x.rate}%</span>
                  </div>
                  <div className='h-2 rounded' style={{ background: '#0D0F14' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${x.rate}%` }} transition={{ duration: 0.8 }} className='h-full rounded' style={{ background: x.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Form */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {[{ team: team1, form: stats.recentForm.team1, color: t1.color }, { team: team2, form: stats.recentForm.team2, color: t2.color }].map(x => (
                <div key={x.team} className='surface-card p-5'>
                  <p className='section-label mb-3'>FORM — LAST 5 ({x.team})</p>
                  <div className='flex gap-2'>
                    {x.form.map((r, i) => (
                      <div key={i} className='w-8 h-8 rounded flex items-center justify-center text-xs font-bold' style={{
                        background: r === 1 ? 'rgba(29,158,117,0.15)' : 'rgba(232,0,61,0.1)',
                        color: r === 1 ? '#1D9E75' : '#E8003D',
                        border: `1px solid ${r === 1 ? 'rgba(29,158,117,0.25)' : 'rgba(232,0,61,0.2)'}`
                      }}>{r === 1 ? 'W' : 'L'}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Signals */}
            {stats.aiPrediction?.signals && (
              <div className='surface-card p-5'>
                <p className='section-label mb-3'>AI PREDICTION SIGNALS</p>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  {[
                    { label: 'Historical', val: stats.aiPrediction.signals.historical, neutral: 50 },
                    { label: 'Form Adj', val: stats.aiPrediction.signals.formAdj, neutral: 0, signed: true },
                    { label: 'Venue Adj', val: stats.aiPrediction.signals.venueAdj, neutral: 0, signed: true },
                    { label: 'Table Adj', val: stats.aiPrediction.signals.tableAdj, neutral: 0, signed: true },
                  ].map(s => (
                    <div key={s.label} className='rounded p-3' style={{ background: '#0D0F14', border: '1px solid #1E2028' }}>
                      <p style={{ fontSize: 10, color: '#3D4356', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</p>
                      <p className='text-lg font-bold' style={{
                        fontFamily: 'var(--font-barlow)',
                        color: s.signed ? (s.val > 0 ? '#1D9E75' : s.val < 0 ? '#E8003D' : '#8890A0') : '#E8E8E8'
                      }}>
                        {s.signed && s.val > 0 ? '+' : ''}{typeof s.val === 'number' ? s.val.toFixed(1) : s.val}{s.signed ? '%' : '%'}
                      </p>
                      <p style={{ fontSize: 10, color: '#3D4356', marginTop: 2 }}>
                        {s.signed ? (s.val > 0 ? `→ ${team1}` : s.val < 0 ? `→ ${team2}` : 'Neutral') : (s.val > 50 ? `→ ${team1}` : s.val < 50 ? `→ ${team2}` : 'Neutral')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Points Table Context */}
            {stats.pointsTable && (
              <div className='surface-card p-5'>
                <p className='section-label mb-3'>CURRENT TABLE CONTEXT</p>
                <div className='grid grid-cols-2 gap-4'>
                  {[{ team: team1, pts: stats.pointsTable.team1Points, qual: stats.pointsTable.team1QualificationChance, color: t1.color },
                    { team: team2, pts: stats.pointsTable.team2Points, qual: stats.pointsTable.team2QualificationChance, color: t2.color }].map(x => (
                    <div key={x.team} className='rounded p-4' style={{ background: '#0D0F14', borderLeft: `3px solid ${x.color}` }}>
                      <p className='font-bold text-sm' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{x.team}</p>
                      <p className='text-2xl font-bold mt-1' style={{ fontFamily: 'var(--font-barlow)' }}>{x.pts} <span style={{ fontSize: 12, color: '#3D4356' }}>PTS</span></p>
                      <p style={{ fontSize: 12, color: '#8890A0', marginTop: 2 }}>Qualification: {x.qual}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
