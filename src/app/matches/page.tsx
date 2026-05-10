'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import { useRouter, useSearchParams } from 'next/navigation';
import { teamInfo, getHistoricalWinProbability } from '@/data/mockData';
import { Calendar, Trophy, Clock, Crown, MapPin, ChevronRight, History, Target, Users } from 'lucide-react';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';

export default function MatchesPage() {
  const { matches, loading, error } = useLiveSystemData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamParam = searchParams.get('team');
  const selectedTeam = teamParam && teamParam in teamInfo ? teamParam : 'ALL';

  if (loading || !matches) {
    return <div className="min-h-screen flex items-center justify-center text-brand-400">Loading Live Matches...</div>;
  }

  const completedMatches = matches.filter(m => m.status === 'completed');
  const upcomingMatches = matches.filter(m => m.status === 'pending' || m.status === 'live');
  const filteredUpcomingMatches = selectedTeam === 'ALL'
    ? upcomingMatches
    : upcomingMatches.filter((match) => match.team1 === selectedTeam || match.team2 === selectedTeam);

  const featuredMatch = filteredUpcomingMatches[0] || upcomingMatches[0] || null;

  const featuredTeamNames = featuredMatch 
    ? [teamInfo[featuredMatch.team1].name, teamInfo[featuredMatch.team2].name] 
    : null;

  return (
    <div className='relative min-h-screen pt-24 pb-16 overflow-hidden'>
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-12'
        >

          <h1 className='text-4xl md:text-5xl font-black mb-4 tracking-tight'>
            <span className='text-gradient bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]'>
              Live Action Hub
            </span>
          </h1>
          <p className='text-slate-400 text-lg max-w-2xl'>Track all completed and upcoming IPL 2026 fixtures in real-time.</p>
          {error && <p className='mt-3 text-sm text-rose-400'>Live data unavailable, showing the last successful snapshot.</p>}
        </motion.div>

        <div className='mb-8 glass-card rounded-3xl p-5 border border-white/10 bg-slate-950/50'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-400 mb-2'>
                <Target className='h-3.5 w-3.5 text-accent-400' /> Team fixture watch
              </div>
              <h2 className='text-xl font-black text-white'>Track one franchise's next matches</h2>
              <p className='text-sm text-slate-400 mt-1 max-w-2xl'>Choose a team to filter the upcoming schedule and jump straight to that franchise's next fixture.</p>
            </div>

            <div className='min-w-[240px]'>
              <label className='block text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 mb-2'>Filter by team</label>
              <select
                value={selectedTeam}
                onChange={(e) => {
                  const nextTeam = e.target.value;
                  const nextUrl = nextTeam === 'ALL' ? '/matches' : `/matches?team=${nextTeam}`;
                  router.replace(nextUrl, { scroll: false });
                }}
                className='w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus:border-brand-400'
              >
                <option value='ALL'>All teams</option>
                {Object.entries(teamInfo).map(([key, team]) => (
                  <option key={key} value={key}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>

          {featuredMatch && featuredTeamNames && (
            <div className='mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
              <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                <div className='flex items-center justify-between gap-4 mb-4'>
                  <div>
                    <p className='text-xs font-bold uppercase tracking-[0.24em] text-slate-500'>Next fixture</p>
                    <h3 className='text-lg font-black text-white'>Match {featuredMatch.matchNumber}</h3>
                  </div>
                  <span className='rounded-full border border-accent-500/20 bg-accent-500/10 px-3 py-1 text-xs font-black text-accent-400'>
                    {selectedTeam === 'ALL' ? 'All teams' : teamInfo[selectedTeam as keyof typeof teamInfo].shortName}
                  </span>
                </div>

                <div className='flex items-center justify-between gap-3'>
                  <div className='flex min-w-0 flex-1 items-center gap-3'>
                    <div className='h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-2'>
                      <img src={teamInfo[featuredMatch.team1].logo} alt={featuredMatch.team1} className='h-full w-full object-contain' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-sm font-bold text-white'>{featuredTeamNames[0]}</p>
                      <p className='text-xs text-slate-500'>{featuredMatch.team1}</p>
                    </div>
                  </div>

                  <div className='rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-black italic text-slate-400'>VS</div>

                  <div className='flex min-w-0 flex-1 items-center justify-end gap-3 text-right'>
                    <div className='min-w-0'>
                      <p className='text-sm font-bold text-white'>{featuredTeamNames[1]}</p>
                      <p className='text-xs text-slate-500'>{featuredMatch.team2}</p>
                    </div>
                    <div className='h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-2'>
                      <img src={teamInfo[featuredMatch.team2].logo} alt={featuredMatch.team2} className='h-full w-full object-contain' />
                    </div>
                  </div>
                </div>

                <div className='mt-4 flex flex-wrap gap-3 text-xs text-slate-400'>
                  <span className='inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold'><Calendar className='h-3.5 w-3.5' /> {featuredMatch.date}</span>
                  <span className='inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold'><MapPin className='h-3.5 w-3.5' /> {featuredMatch.venue}</span>
                  <span className='inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold'><Users className='h-3.5 w-3.5' /> {featuredMatch.status === 'live' ? 'Live soon' : 'Upcoming'}</span>
                </div>
              </div>

              <div className='rounded-2xl border border-white/10 bg-slate-950/60 p-4'>
                <p className='text-xs font-bold uppercase tracking-[0.24em] text-slate-500'>Filtered list</p>
                <div className='mt-2 text-3xl font-black text-white'>{filteredUpcomingMatches.length}</div>
                <p className='mt-1 text-sm text-slate-400'>Upcoming matches for the selected view.</p>
                {selectedTeam !== 'ALL' && (
                  <Link
                    href='/matches'
                    className='mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10'
                  >
                    Clear filter <ChevronRight className='h-4 w-4' />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Completed Matches */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-brand-500/20 rounded-lg"><Trophy className="w-5 h-5 text-brand-400" /></div>
              <h2 className='text-2xl font-bold text-white'>Recent Results</h2>
            </div>
            
            <div className='space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar'>
              {completedMatches.slice().reverse().map((match, idx) => {
                const t1 = teamInfo[match.team1];
                const t2 = teamInfo[match.team2];
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className='glass-card rounded-3xl p-6 relative overflow-hidden group'
                  >
                    {/* Glowing background behind winner */}
                    <div className={`absolute top-1/2 -translate-y-1/2 ${match.winner === match.team1 ? 'left-0' : 'right-0'} w-32 h-32 blur-[60px] opacity-20 pointer-events-none transition-all duration-500`} style={{ backgroundColor: match.winner === match.team1 ? t1.color : t2.color }}></div>

                    <div className='flex justify-between items-center mb-6'>
                      <span className='text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center'>
                        <Calendar className="w-3.5 h-3.5 mr-1.5" /> {match.date}
                      </span>
                      <span className='px-4 py-1.5 bg-brand-500/20 text-brand-400 rounded-full text-xs font-black shadow-[inset_0_0_10px_rgba(234,179,8,0.2)]'>Match {match.matchNumber}</span>
                    </div>
                    
                    <div className='flex items-center justify-between mb-6 relative z-10'>
                      <div className="flex flex-col items-center w-1/3 relative">
                        {match.winner === match.team1 && <Crown className="absolute -top-6 w-5 h-5 text-amber-400 animate-bounce" />}
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-120 overflow-hidden bg-gradient-to-br from-white/15 via-white/5 to-white/0 ${match.winner === match.team1 ? 'border-amber-400 shadow-[0_0_20px_rgba(251,146,60,0.3),0_4px_12px_rgba(0,0,0,0.4)]' : 'border-white/20 shadow-md opacity-75'}`}>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                          <img
                            src={t1.logo}
                            alt={t1.shortName}
                            className="w-11 h-11 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] relative z-10"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.onerror = null;
                              img.src = t1.fallbackLogo || `https://ui-avatars.com/api/?name=${t1.shortName}&background=random&color=fff`;
                            }}
                          />
                        </div>
                        <span className={`mt-2 font-bold ${match.winner === match.team1 ? 'text-white' : 'text-slate-500'}`}>{t1.shortName}</span>
                      </div>
                      
                      <div className="flex flex-col items-center w-1/3">
                        <span className='text-slate-600 text-lg font-black italic'>VS</span>
                      </div>
                      
                      <div className="flex flex-col items-center w-1/3 relative">
                        {match.winner === match.team2 && <Crown className="absolute -top-6 w-5 h-5 text-amber-400 animate-bounce" />}
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-120 overflow-hidden bg-gradient-to-br from-white/15 via-white/5 to-white/0 ${match.winner === match.team2 ? 'border-amber-400 shadow-[0_0_20px_rgba(251,146,60,0.3),0_4px_12px_rgba(0,0,0,0.4)]' : 'border-white/20 shadow-md opacity-75'}`}>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                          <img
                            src={t2.logo}
                            alt={t2.shortName}
                            className="w-11 h-11 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] relative z-10"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.onerror = null;
                              img.src = t2.fallbackLogo || `https://ui-avatars.com/api/?name=${t2.shortName}&background=random&color=fff`;
                            }}
                          />
                        </div>
                        <span className={`mt-2 font-bold ${match.winner === match.team2 ? 'text-white' : 'text-slate-500'}`}>{t2.shortName}</span>
                      </div>
                    </div>
                    
                    <div className='text-center py-3 px-4 bg-gradient-to-r from-brand-500/10 via-brand-500/20 to-brand-500/10 rounded-xl border border-brand-500/20'>
                      <span className='text-sm text-brand-400 font-bold'>
                        {match.winner} won by {match.margin} {match.marginType}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Matches */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-accent-500/20 rounded-lg"><Clock className="w-5 h-5 text-accent-400" /></div>
              <h2 className='text-2xl font-bold text-white'>
                {selectedTeam === 'ALL' ? 'Upcoming Fixtures' : `${teamInfo[selectedTeam as keyof typeof teamInfo].shortName} Upcoming Fixtures`}
              </h2>
            </div>
            
            <div className='space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar'>
              {filteredUpcomingMatches.length > 0 ? filteredUpcomingMatches.map((match, idx) => {
                const t1 = teamInfo[match.team1];
                const t2 = teamInfo[match.team2];
                const t1Prob = getHistoricalWinProbability(match.team1, match.team2);
                const t2Prob = 100 - t1Prob;

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className='glass-card rounded-3xl p-6 relative overflow-hidden group cursor-pointer'
                  >
                    <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-accent-500/10 transition-colors duration-500'></div>

                    <div className='flex justify-between items-center mb-6 relative z-10'>
                      <span className='text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center'>
                        <Calendar className="w-3.5 h-3.5 mr-1.5" /> {match.date}
                      </span>
                      <span className='px-4 py-1.5 bg-accent-500/20 text-accent-400 rounded-full text-xs font-black shadow-[inset_0_0_10px_rgba(56,189,248,0.2)]'>Match {match.matchNumber}</span>
                    </div>
                    
                    <div className='flex items-center justify-between relative z-10 mb-6'>
                      <div className="flex flex-col items-center w-1/3 space-y-3">
                        <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center shadow-xl group-hover:scale-125 transition-all duration-300 overflow-hidden bg-gradient-to-br from-white/15 via-white/5 to-white/0 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                          <img
                            src={t1.logo}
                            alt={t1.shortName}
                            className="w-13 h-13 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.4)] relative z-10"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.onerror = null;
                              img.src = t1.fallbackLogo || `https://ui-avatars.com/api/?name=${t1.shortName}&background=random&color=fff`;
                            }}
                          />
                        </div>
                        <span className="text-white font-bold tracking-wide">{t1.shortName}</span>
                      </div>
                      
                      <div className="flex flex-col items-center w-1/3">
                        <span className='text-slate-600 font-black text-lg italic mb-2'>VS</span>
                        <div className="flex items-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest text-center px-2 py-1 bg-white/5 rounded-full">
                          <MapPin className="w-3 h-3 mr-1" /> {match.venue.split(',')[0]}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center w-1/3 space-y-3">
                        <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center shadow-xl group-hover:scale-125 transition-all duration-300 overflow-hidden bg-gradient-to-br from-white/15 via-white/5 to-white/0 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                          <img
                            src={t2.logo}
                            alt={t2.shortName}
                            className="w-13 h-13 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.4)] relative z-10"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.onerror = null;
                              img.src = t2.fallbackLogo || `https://ui-avatars.com/api/?name=${t2.shortName}&background=random&color=fff`;
                            }}
                          />
                        </div>
                        <span className="text-white font-bold tracking-wide">{t2.shortName}</span>
                      </div>
                    </div>

                    {/* Historical H2H Probability Bar */}
                    <div className="relative z-10 mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center uppercase tracking-widest"><History className="w-3 h-3 mr-1" /> All-Time H2H Probability</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black text-white" style={{ textShadow: `0 0 10px ${t1.color}` }}>{t1Prob}%</span>
                        <span className="text-sm font-black text-white" style={{ textShadow: `0 0 10px ${t2.color}` }}>{t2Prob}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-900/50 rounded-full flex gap-1 p-0.5">
                        <div className="h-full rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${t1Prob}%`, backgroundColor: t1.color, boxShadow: `0 0 15px ${t1.color}80` }}></div>
                        <div className="h-full rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${t2Prob}%`, backgroundColor: t2.color, boxShadow: `0 0 15px ${t2.color}80` }}></div>
                      </div>
                    </div>

                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                      <ChevronRight className="w-6 h-6 text-accent-400" />
                    </div>
                  </motion.div>
                );
              }) : (
                <div className='rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400'>
                  No upcoming matches found for the selected team.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
