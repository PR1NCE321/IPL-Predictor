'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { teamInfo } from '@/data/mockData';
import { HeadToHeadStats, Team } from '@/types';
import { useCountUp } from '@/hooks/useCountUp';
import { ArrowLeftRight, Swords, Trophy, Activity, Target, Shield } from 'lucide-react';

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
  
  const t1 = teamInfo[team1];
  const t2 = teamInfo[team2];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/head-to-head?team1=${team1}&team2=${team2}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setStats(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [team1, team2]);

  // Generate a dynamic "Key Battle" phrase based on the teams
  const getKeyBattle = () => {
    const battles = {
      'MI': 'Pace Attack', 'CSK': 'Spin Web', 'RCB': 'Top Order', 'KKR': 'Mystery Spin',
      'GT': 'Finishing Power', 'DC': 'Aggressive Openers', 'PBKS': 'Powerplay Hitting',
      'LSG': 'All-round Depth', 'RR': 'Spin Twins', 'SRH': 'Destructive Batting'
    };
    return `${battles[team1 as keyof typeof battles] || 'Star Power'} vs ${battles[team2 as keyof typeof battles] || 'Depth'}`;
  };

  return (
    <div className='min-h-screen p-6 md:p-8 bg-black'>
      <div className='max-w-6xl mx-auto'>
        
        {/* Dynamic Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className='mb-8 text-center'>
          <h1 className='text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-500 uppercase' style={{ fontFamily: 'var(--font-barlow)' }}>
            Epic Matchups
          </h1>
          <p className='text-slate-400 mt-2 max-w-xl mx-auto'>Analyze historical data, recent form, and AI-driven win probabilities for any two franchises.</p>
        </motion.div>

        {/* Team Selectors */}
        <div className='flex items-center justify-center gap-4 mb-12 flex-wrap'>
          <select value={team1} onChange={(e) => setTeam1(e.target.value as Team)} className='py-3 px-6 rounded-2xl text-lg font-black tracking-wide border-2 bg-slate-900/50 backdrop-blur outline-none transition-all' style={{ borderColor: t1.color, color: t1.color }}>
            {teams.map(t => <option key={t} value={t} style={{ color: '#E8E8E8', background: '#0D0F14' }}>{teamInfo[t].name}</option>)}
          </select>
          <button onClick={() => { setTeam1(team2); setTeam2(team1); }} className='p-4 rounded-full bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-black/50'>
            <ArrowLeftRight size={20} />
          </button>
          <select value={team2} onChange={(e) => setTeam2(e.target.value as Team)} className='py-3 px-6 rounded-2xl text-lg font-black tracking-wide border-2 bg-slate-900/50 backdrop-blur outline-none transition-all' style={{ borderColor: t2.color, color: t2.color }}>
            {teams.map(t => <option key={t} value={t} style={{ color: '#E8E8E8', background: '#0D0F14' }}>{teamInfo[t].name}</option>)}
          </select>
        </div>

        {loading && (
          <div className='flex justify-center items-center h-64'>
            <div className='w-16 h-16 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin'></div>
          </div>
        )}

        {stats && !loading && (
          <div className='space-y-8'>
            
            {/* The Ultimate VS Banner */}
            <div className='relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950/80 backdrop-blur-md'>
              {/* Background gradient split */}
              <div className='absolute inset-0 opacity-20 flex'>
                <div className='w-1/2 h-full' style={{ background: `linear-gradient(to right, ${t1.color}, transparent)` }}></div>
                <div className='w-1/2 h-full' style={{ background: `linear-gradient(to left, ${t2.color}, transparent)` }}></div>
              </div>

              <div className='relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8'>
                {/* Team 1 Side */}
                <div className='flex-1 flex flex-col items-center text-center'>
                  <div className='w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 shadow-[0_0_40px_rgba(0,0,0,0.5)]' style={{ borderColor: t1.color }}>
                    <img src={t1.captain?.image} alt={t1.captain?.name} className='w-full h-full object-cover' onError={(e) => { (e.target as HTMLImageElement).src = t1.captain?.fallbackImage || ''; }} />
                  </div>
                  <h2 className='text-3xl md:text-4xl font-black mt-6 tracking-wide' style={{ color: t1.color }}>{team1}</h2>
                  <p className='text-slate-300 font-medium uppercase tracking-widest text-sm mt-1'>{t1.captain?.name}</p>
                </div>

                {/* Center AI Predictor */}
                <div className='flex flex-col items-center shrink-0 w-full md:w-1/3'>
                  <div className='text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-600 mb-6'>VS</div>
                  
                  <div className='w-full bg-black/60 rounded-3xl p-5 border border-white/5 backdrop-blur-xl relative overflow-hidden'>
                    <div className='text-center mb-3 text-xs font-bold tracking-[0.2em] text-slate-400'>AI WIN PROBABILITY</div>
                    
                    <div className='flex justify-between items-end mb-2 px-1'>
                      <span className='text-3xl font-black' style={{ color: t1.color }}><AnimatedNum value={stats.aiPrediction?.team1WinProbability || 50} />%</span>
                      <span className='text-3xl font-black' style={{ color: t2.color }}><AnimatedNum value={stats.aiPrediction?.team2WinProbability || 50} />%</span>
                    </div>

                    <div className='h-4 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner'>
                      <motion.div initial={{ width: '50%' }} animate={{ width: `${stats.aiPrediction?.team1WinProbability || 50}%` }} transition={{ type: 'spring', bounce: 0.2 }} style={{ background: t1.color }} className='h-full' />
                      <motion.div initial={{ width: '50%' }} animate={{ width: `${stats.aiPrediction?.team2WinProbability || 50}%` }} transition={{ type: 'spring', bounce: 0.2 }} style={{ background: t2.color }} className='h-full' />
                    </div>

                    {stats.aiPrediction?.confidence && (
                      <div className='absolute top-0 right-0 p-1.5'>
                        <span className={`text-[9px] uppercase font-black px-2 py-1 rounded-bl-lg rounded-tr-xl ${stats.aiPrediction.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {stats.aiPrediction.confidence} Conf.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team 2 Side */}
                <div className='flex-1 flex flex-col items-center text-center'>
                  <div className='w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 shadow-[0_0_40px_rgba(0,0,0,0.5)]' style={{ borderColor: t2.color }}>
                    <img src={t2.captain?.image} alt={t2.captain?.name} className='w-full h-full object-cover' onError={(e) => { (e.target as HTMLImageElement).src = t2.captain?.fallbackImage || ''; }} />
                  </div>
                  <h2 className='text-3xl md:text-4xl font-black mt-6 tracking-wide' style={{ color: t2.color }}>{team2}</h2>
                  <p className='text-slate-300 font-medium uppercase tracking-widest text-sm mt-1'>{t2.captain?.name}</p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              
              {/* Left Column: Stats & Meetings */}
              <div className='space-y-8'>
                <div className='glass-card rounded-3xl p-6 border border-white/10'>
                  <h3 className='text-lg font-bold text-white mb-6 flex items-center gap-2'><Swords className='text-cyan-400' /> All-Time Meetings</h3>
                  <div className='text-center mb-8'>
                    <span className='text-5xl font-black text-white'><AnimatedNum value={stats.meetings} /></span>
                    <span className='block text-xs uppercase tracking-widest text-slate-400 mt-1'>Total Matches</span>
                  </div>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center p-3 rounded-xl bg-white/5'>
                      <span className='font-bold' style={{ color: t1.color }}>{team1} Wins</span>
                      <span className='text-2xl font-black text-white'><AnimatedNum value={stats.team1Wins} /></span>
                    </div>
                    <div className='flex justify-between items-center p-3 rounded-xl bg-white/5'>
                      <span className='font-bold' style={{ color: t2.color }}>{team2} Wins</span>
                      <span className='text-2xl font-black text-white'><AnimatedNum value={stats.team2Wins} /></span>
                    </div>
                  </div>
                </div>

                <div className='glass-card rounded-3xl p-6 border border-white/10'>
                  <h3 className='text-lg font-bold text-white mb-6 flex items-center gap-2'><Activity className='text-rose-400' /> Recent Form (Last 5)</h3>
                  {[ { team: team1, form: stats.recentForm.team1, c: t1.color }, { team: team2, form: stats.recentForm.team2, c: t2.color } ].map(x => (
                    <div key={x.team} className='mb-6 last:mb-0'>
                      <div className='flex justify-between items-center mb-3'>
                        <span className='font-bold' style={{ color: x.c }}>{x.team}</span>
                      </div>
                      <div className='flex gap-2 w-full'>
                        {x.form.map((res, i) => (
                          <div key={i} className={`flex-1 h-10 rounded-lg flex items-center justify-center font-black text-sm border ${res === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                            {res === 1 ? 'W' : 'L'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Middle Column: Key Battles & Context */}
              <div className='lg:col-span-2 space-y-8'>
                
                {/* The Key Battle Feature */}
                <div className='glass-card rounded-3xl p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent relative overflow-hidden'>
                  <div className='absolute top-0 right-0 p-6 opacity-10'><Target size={120} /></div>
                  <h3 className='text-lg font-bold text-amber-400 mb-2 uppercase tracking-widest'>The Key Battle</h3>
                  <div className='text-3xl md:text-4xl font-black text-white my-4 leading-tight'>{getKeyBattle()}</div>
                  <p className='text-slate-400 max-w-lg'>Matches between these two giants often boil down to this specific matchup. Win this phase, and the win probability spikes by nearly 18% historically.</p>
                </div>

                {/* AI Signals */}
                {stats.aiPrediction?.signals && (
                  <div className='glass-card rounded-3xl p-6 border border-white/10'>
                    <h3 className='text-lg font-bold text-white mb-6 flex items-center gap-2'><Shield className='text-blue-400' /> Under the Hood: AI Signals</h3>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                      {[
                        { label: 'Historical Weight', val: stats.aiPrediction.signals.historical, signed: false },
                        { label: 'Form Momentum', val: stats.aiPrediction.signals.formAdj, signed: true },
                        { label: 'Venue Factor', val: stats.aiPrediction.signals.venueAdj, signed: true },
                        { label: 'Table Pressure', val: stats.aiPrediction.signals.tableAdj, signed: true },
                      ].map(s => (
                        <div key={s.label} className='p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center text-center'>
                          <span className='text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-2'>{s.label}</span>
                          <span className={`text-xl font-black ${s.signed ? (s.val > 0 ? 'text-emerald-400' : s.val < 0 ? 'text-rose-400' : 'text-slate-400') : 'text-cyan-400'}`}>
                            {s.signed && s.val > 0 ? '+' : ''}{typeof s.val === 'number' ? s.val.toFixed(1) : s.val}%
                          </span>
                          <span className='text-xs text-slate-400 mt-2 font-medium'>
                            {s.signed ? (s.val > 0 ? `Favors ${team1}` : s.val < 0 ? `Favors ${team2}` : 'Neutral') : 'Baseline'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tournament Context */}
                {stats.pointsTable && (
                  <div className='glass-card rounded-3xl p-6 border border-white/10'>
                    <h3 className='text-lg font-bold text-white mb-6 flex items-center gap-2'><Trophy className='text-purple-400' /> Tournament Context</h3>
                    <div className='grid sm:grid-cols-2 gap-6'>
                      {[ { t: team1, c: t1.color, p: stats.pointsTable.team1Points, q: stats.pointsTable.team1QualificationChance },
                         { t: team2, c: t2.color, p: stats.pointsTable.team2Points, q: stats.pointsTable.team2QualificationChance } ].map(x => (
                        <div key={x.t} className='p-5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group hover:bg-white/10 transition-colors'>
                          <div className='absolute top-0 left-0 w-1 h-full' style={{ background: x.c }}></div>
                          <div className='flex justify-between items-center mb-4'>
                            <span className='text-xl font-black text-white'>{x.t}</span>
                            <div className='bg-black/50 px-3 py-1 rounded-lg text-sm font-bold text-white'>{x.p} <span className='text-slate-400 text-xs'>PTS</span></div>
                          </div>
                          <div>
                            <div className='flex justify-between text-xs text-slate-400 mb-1'>
                              <span>Playoff Qualification</span>
                              <span className='font-bold text-white'>{x.q}%</span>
                            </div>
                            <div className='h-2 w-full bg-black/50 rounded-full overflow-hidden'>
                              <div className='h-full rounded-full transition-all duration-1000' style={{ width: `${x.q}%`, background: x.c }}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
