'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { teamInfo } from '@/data/mockData';
import { Trophy, Activity, Target } from 'lucide-react';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';

export default function TeamsPage() {
  const { pointsTable: currentPointsTable, matches, loading, error } = useLiveSystemData();

  if (loading || !currentPointsTable) {
    return <div className="min-h-screen flex items-center justify-center text-brand-400">Loading Live Team Data...</div>;
  }

  return (
    <div className='relative min-h-screen pt-24 pb-16 overflow-hidden'>
      {/* Decorative Background */}
      <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-12'
        >

          <h1 className='text-4xl md:text-5xl font-black mb-4 tracking-tight'>
            <span className='text-gradient bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]'>
              Franchise Intelligence
            </span>
          </h1>
          <p className='text-slate-400 text-lg max-w-2xl'>Deep dive into all 10 IPL franchises with performance metrics and qualification scenarios.</p>
          {error && <p className='mt-3 text-sm text-rose-400'>Live data unavailable, showing the last successful snapshot.</p>}
        </motion.div>

        {/* Teams Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6'>
          {Object.values(teamInfo).map((team, idx) => {
            const stats = currentPointsTable.find(t => t.team === team.shortName);
            const rank = currentPointsTable.findIndex(t => t.team === team.shortName) + 1;
            
            const teamMatches = matches?.filter(m => m.status === 'completed' && (m.team1 === team.shortName || m.team2 === team.shortName)) || [];
            const last5Matches = teamMatches.slice(-5);
            const formGuide = last5Matches.map(m => m.winner === team.shortName ? 'W' : 'L');
            
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass-card rounded-3xl p-6 group relative overflow-hidden transition-all duration-300 hover:-translate-y-2 flex flex-col h-full ${rank <= 4 ? 'border-brand-500/30' : 'border-white/10'}`}
                style={{ '--hover-color': team.color } as React.CSSProperties}
              >
                {rank <= 4 && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/20 rounded-bl-3xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-brand-400 animate-pulse" />
                  </div>
                )}
                {/* Dynamic hover glow based on team color */}
                <div 
                  className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[50px] opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ backgroundColor: team.color }}
                ></div>

                <div className="relative z-10 flex flex-col items-center mb-6">
                  <div 
                    className='w-32 h-32 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_32px_rgba(0,0,0,0.5),0_8px_20px_rgba(0,0,0,0.3)] border-4 border-white/30 transform group-hover:scale-110 transition-all duration-300 overflow-hidden bg-gradient-to-br from-white/20 via-white/10 to-white/0 p-4 group-hover:shadow-[0_0_40px_rgba(0,0,0,0.6),0_12px_30px_rgba(0,0,0,0.4)] group-hover:border-white/40'
                    style={{ borderColor: team.color }}
                  >
                    <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                    <img
                      src={team.logo}
                      alt={`${team.shortName} Logo`}
                      className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] relative z-10"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.src = team.fallbackLogo || `https://ui-avatars.com/api/?name=${team.shortName}&background=random&color=fff`;
                      }}
                    />
                  </div>
                  <h3 className='text-lg font-bold text-white text-center leading-tight mb-1'>{team.name}</h3>
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Rank {rank}</span>
                    {rank === 1 && <Trophy className="w-3 h-3 text-amber-400" />}
                  </div>
                </div>

                <div className='space-y-4 relative z-10 flex-1 flex flex-col justify-end'>
                  <div className='bg-white/5 rounded-xl p-4 border border-white/5'>
                    <div className='flex justify-between items-center mb-2'>
                      <span className='text-slate-400 text-sm flex items-center'><Trophy className="w-3 h-3 mr-1.5" /> Wins</span>
                      <span className='text-green-400 font-bold'>{stats?.wins || 0}</span>
                    </div>
                    <div className='flex justify-between items-center mb-2'>
                      <span className='text-slate-400 text-sm flex items-center'><Activity className="w-3 h-3 mr-1.5" /> Losses</span>
                      <span className='text-rose-400 font-bold'>{stats?.losses || 0}</span>
                    </div>
                    <div className='flex justify-between items-center pt-2 mt-2 border-t border-white/5'>
                      <span className='text-slate-400 text-sm flex items-center'><Target className="w-3 h-3 mr-1.5" /> Qual %</span>
                      <span className={`font-black ${stats && stats.qualificationChance > 70 ? 'text-green-400' : stats && stats.qualificationChance > 30 ? 'text-yellow-400' : 'text-rose-400'}`}>
                        {stats?.qualificationChance || 0}%
                      </span>
                    </div>
                    <div className='flex flex-wrap items-center justify-between gap-y-2 pt-2 mt-2 border-t border-white/5'>
                      <span className='text-slate-400 text-sm flex items-center'><Activity className="w-3 h-3 mr-1.5" /> Form</span>
                      <div className="flex gap-1">
                        {formGuide.length > 0 ? formGuide.map((res, i) => (
                          <span key={i} className={`flex items-center justify-center w-4 h-4 rounded-sm text-[9px] font-bold ${res === 'W' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                            {res}
                          </span>
                        )) : <span className="text-xs text-slate-500">N/A</span>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Captain Profile */}
                  <div className='bg-slate-900/50 rounded-2xl p-3 border border-white/5 flex items-center space-x-3 mt-4'>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 shadow-inner shrink-0">
                      <img
                        src={team.captain?.image}
                        alt={team.captain?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = team.captain?.fallbackImage || `https://ui-avatars.com/api/?name=${team.captain?.name}&background=random&color=fff`;
                        }}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Captain</span>
                      <span className="text-sm font-bold text-white truncate">{team.captain?.name}</span>
                    </div>
                  </div>
                  
                  <p className='text-xs text-slate-500 text-center italic mt-4'>
                    {team.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
