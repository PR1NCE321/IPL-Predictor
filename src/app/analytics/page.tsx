'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { teamInfo } from '@/data/mockData';
import { ChevronLeft, TrendingUp, AlertCircle, CheckCircle2, Trophy, Crown, Medal, Activity } from 'lucide-react';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';
import { TeamLogoBadge } from '@/components/common/TeamLogoBadge';

export default function AnalyticsPage() {
  const { matches, pointsTable: sortedTable, loading, error } = useLiveSystemData();
  const [mcProbabilities, setMcProbabilities] = useState<Record<string, number>>({});
  const [isSimulating, setIsSimulating] = useState(true);

  // Live Monte Carlo Simulation Engine
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
    // Non-blocking Monte Carlo computation
    setTimeout(() => {
      const NUM_SIMS = 10000;
      const qualifyCount: Record<string, number> = {};
      sortedTable.forEach(t => qualifyCount[t.team] = 0);
      
      for (let i = 0; i < NUM_SIMS; i++) {
        const simPoints: Record<string, number> = {};
        sortedTable.forEach(t => simPoints[t.team] = t.points);
        
        for (let j = 0; j < pendingMatches.length; j++) {
          const m = pendingMatches[j];
          const winner = Math.random() > 0.5 ? m.team1 : m.team2;
          simPoints[winner] += 2;
        }
        
        const simTable = sortedTable.map(t => ({
          team: t.team,
          pts: simPoints[t.team],
          nrr: t.nrr // Basic tie breaker
        })).sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          // In reality, NRR would shift dynamically, but for ultra-fast sim, base NRR is used to resolve ties
          return b.nrr - a.nrr; 
        });
        
        // Top 4 qualify
        for (let j = 0; j < 4; j++) {
          qualifyCount[simTable[j].team] += 1;
        }
      }
      
      const finalProbs: Record<string, number> = {};
      for (const team in qualifyCount) {
        finalProbs[team] = (qualifyCount[team] / NUM_SIMS) * 100;
      }
      setMcProbabilities(finalProbs);
      setIsSimulating(false);
    }, 100);
  }, [matches, sortedTable]);

  if (loading || !sortedTable) {
    return <div className="min-h-screen flex items-center justify-center text-brand-400">Loading Live Standings...</div>;
  }

  const playoffLeader = sortedTable[0].team;
  const inContentionCount = sortedTable.filter(t => {
    const chance = mcProbabilities[t.team] || 0;
    return chance > 0 && chance < 100;
  }).length;

  return (
    <div className='relative min-h-screen pt-24 pb-16 overflow-hidden'>
      {/* Decorative Background */}
      <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-accent-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-brand-500/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6'
        >
          <div>
            <h1 className='text-4xl md:text-5xl font-black mb-4 tracking-tight'>
              <span className='text-gradient bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]'>
                Analytics Dashboard
              </span>
            </h1>
            <p className='text-slate-400 text-lg max-w-2xl'>Live Monte Carlo simulations computing exactly 10,000 future scenarios to calculate real qualification probabilities.</p>
            {error && <p className='mt-3 text-sm text-rose-400'>Live data unavailable, showing the last successful snapshot.</p>}
          </div>

          <div className={`px-4 py-2 rounded-xl flex items-center border ${isSimulating ? 'bg-accent-500/10 border-accent-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
            {isSimulating ? (
              <>
                <Activity className="w-4 h-4 text-accent-400 animate-pulse mr-2" />
                <span className="text-accent-400 text-sm font-bold">Running 10,000 Simulations...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-green-400 text-sm font-bold">Probabilities Updated</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Stats Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='glass-card rounded-3xl overflow-hidden shadow-2xl relative'
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
          
          <div className="overflow-x-auto relative z-10">
            <table className='w-full whitespace-nowrap'>
              <thead>
                <tr className='bg-slate-900/80 border-b border-white/10'>
                  <th className='px-6 py-5 text-left text-sm font-black tracking-wider text-slate-400 uppercase'>Pos</th>
                  <th className='px-6 py-5 text-left text-sm font-black tracking-wider text-slate-400 uppercase'>Franchise</th>
                  <th className='px-6 py-5 text-center text-sm font-black tracking-wider text-slate-400 uppercase'>P</th>
                  <th className='px-6 py-5 text-center text-sm font-black tracking-wider text-slate-400 uppercase'>W</th>
                  <th className='px-6 py-5 text-center text-sm font-black tracking-wider text-slate-400 uppercase'>L</th>
                  <th className='px-6 py-5 text-center text-sm font-black tracking-wider text-brand-400 uppercase'>Pts</th>
                  <th className='px-6 py-5 text-center text-sm font-black tracking-wider text-slate-400 uppercase'>NRR</th>
                  <th className='px-6 py-5 text-center text-sm font-black tracking-wider text-accent-400 uppercase'>Qualification %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {sortedTable.map((stat, idx) => {
                    const t = teamInfo[stat.team];
                    const isQ1 = idx === 0 || idx === 1; // Top 2
                    const isEliminator = idx === 2 || idx === 3; // 3 & 4
                    const isTop4 = isQ1 || isEliminator;
                    
                    const actualChance = isSimulating ? 0 : (mcProbabilities[stat.team] || 0);

                    return (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        key={stat.team} 
                        className={`hover:bg-white/5 transition-colors group ${isQ1 ? 'bg-amber-500/5' : isEliminator ? 'bg-brand-500/5' : ''}`}
                      >
                        <td className='px-6 py-5 font-bold'>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${isQ1 ? 'bg-amber-500/20 text-amber-400' : isEliminator ? 'bg-brand-500/20 text-brand-400' : 'text-slate-500'}`}>
                              {idx + 1}
                            </span>
                            {isQ1 && <Crown className="w-4 h-4 text-amber-400 drop-shadow-md" />}
                            {isEliminator && <Medal className="w-4 h-4 text-brand-400 drop-shadow-md" />}
                          </div>
                        </td>
                        <td className='px-6 py-5'>
                          <div className="flex items-center space-x-4">
                            <TeamLogoBadge
                              team={t}
                              className={`w-10 h-10 rounded-full border-2 shadow-lg transition-transform group-hover:scale-110 overflow-hidden bg-gradient-to-br from-white/15 via-white/5 to-white/0 ${isTop4 ? 'border-white/20' : 'border-transparent'}`}
                              imageClassName="w-7 h-7 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                            />
                            <span className={`font-bold tracking-wide ${isTop4 ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`}>{t.name}</span>
                          </div>
                        </td>
                        <td className='px-6 py-5 text-center text-slate-400 font-semibold'>{stat.matches}</td>
                        <td className='px-6 py-5 text-center text-green-400 font-bold'>{stat.wins}</td>
                        <td className='px-6 py-5 text-center text-rose-400 font-bold'>{stat.losses}</td>
                        <td className={`px-6 py-5 text-center font-black text-xl ${isTop4 ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-300'}`}>{stat.points}</td>
                        <td className={`px-6 py-5 text-center font-bold ${stat.nrr > 0 ? 'text-green-400' : 'text-rose-400'}`}>
                          {stat.nrr > 0 ? '+' : ''}{stat.nrr.toFixed(3)}
                        </td>
                        <td className='px-6 py-5 text-center'>
                          <div className="flex items-center justify-center space-x-3">
                            <div className="w-24 bg-slate-900 rounded-full h-3 overflow-hidden shadow-inner relative">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${actualChance}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={`h-full rounded-full overflow-hidden relative ${actualChance > 70 ? 'bg-gradient-to-r from-green-600 to-green-400' : actualChance > 30 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`} 
                              >
                                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_linear_infinite] bg-[length:200%_auto]"></div>
                              </motion.div>
                            </div>
                            <span className={`font-black w-12 text-right ${actualChance > 70 ? 'text-green-400' : actualChance > 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {isSimulating ? '...' : `${actualChance.toFixed(1)}%`}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Key Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-12'
        >
          <div className='glass-card rounded-3xl p-8 relative overflow-hidden group hover:scale-[1.02] transition-transform'>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full group-hover:bg-amber-500/30 transition-colors"></div>
            <div className="flex items-center space-x-3 mb-6 relative z-10">
              <div className="p-3 bg-amber-500/20 rounded-xl"><Crown className="w-6 h-6 text-amber-400" /></div>
              <h3 className="text-white font-bold tracking-wide">Playoff Leader</h3>
            </div>
            <div className='text-5xl font-black text-white mb-2 relative z-10'>{playoffLeader}</div>
            <div className='text-amber-400 font-bold relative z-10'>{isSimulating ? '...' : (mcProbabilities[playoffLeader] || 0).toFixed(1)}% chance to qualify</div>
          </div>

          <div className='glass-card rounded-3xl p-8 relative overflow-hidden group hover:scale-[1.02] transition-transform'>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-500/20 blur-3xl rounded-full group-hover:bg-brand-500/30 transition-colors"></div>
            <div className="flex items-center space-x-3 mb-6 relative z-10">
              <div className="p-3 bg-brand-500/20 rounded-xl"><AlertCircle className="w-6 h-6 text-brand-400" /></div>
              <h3 className="text-white font-bold tracking-wide">In Contention</h3>
            </div>
            <div className='text-5xl font-black text-white mb-2 relative z-10'>{inContentionCount} <span className="text-2xl text-slate-400">Teams</span></div>
            <div className='text-brand-400 font-bold relative z-10'>Still fighting for top 4</div>
          </div>

          <div className='glass-card rounded-3xl p-8 relative overflow-hidden group hover:scale-[1.02] transition-transform'>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-500/20 blur-3xl rounded-full group-hover:bg-accent-500/30 transition-colors"></div>
            <div className="flex items-center space-x-3 mb-6 relative z-10">
              <div className="p-3 bg-accent-500/20 rounded-xl"><TrendingUp className="w-6 h-6 text-accent-400" /></div>
              <h3 className="text-white font-bold tracking-wide">Monte Carlo Engine</h3>
            </div>
            <div className='text-5xl font-black text-white mb-2 relative z-10'>10,000</div>
            <div className='text-accent-400 font-bold relative z-10'>Simulations run per refresh</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
