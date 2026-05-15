'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import playerBattlesData from '@/data/playerBattles.json';
import { Swords, Search, X, Crosshair } from 'lucide-react';

const C = {
  white: '#FFFFFF', textPrimary: '#F0F2F5', textSecondary: '#C5CBD6',
  textMuted: '#9AA2B5', gold: '#D4AF37', green: '#34D399', red: '#F87171',
  cardBg: '#131620', cardBorder: '#1F2233', elevated: '#1A1D26',
};

export default function PlayerBattlesPage() {
  const [batterSearch, setBatterSearch] = useState('V Kohli');
  const [bowlerSearch, setBowlerSearch] = useState('JJ Bumrah');
  
  // Extract all unique batters and bowlers
  const { batters, bowlers } = useMemo(() => {
    const bSet = new Set<string>();
    const boSet = new Set<string>();
    Object.keys(playerBattlesData).forEach(key => {
      const [bat, bowl] = key.split('|');
      if (bat) bSet.add(bat);
      if (bowl) boSet.add(bowl);
    });
    return { batters: Array.from(bSet).sort(), bowlers: Array.from(boSet).sort() };
  }, []);

  const [activeBatter, setActiveBatter] = useState('V Kohli');
  const [activeBowler, setActiveBowler] = useState('JJ Bumrah');

  const filteredBatters = useMemo(() => batters.filter(b => b.toLowerCase().includes(batterSearch.toLowerCase())).slice(0, 5), [batterSearch, batters]);
  const filteredBowlers = useMemo(() => bowlers.filter(b => b.toLowerCase().includes(bowlerSearch.toLowerCase())).slice(0, 5), [bowlerSearch, bowlers]);

  const battleKey = `${activeBatter}|${activeBowler}`;
  const battleStats = (playerBattlesData as any)[battleKey];

  return (
    <div className='min-h-screen p-6 md:p-8' style={{ position: 'relative' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(212,175,55,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212,175,55,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      <div className='max-w-[1000px] mx-auto' style={{ position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className='mb-12'>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gold }}>
              <Crosshair size={24} />
            </div>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>ULTIMATE SHOWDOWN</p>
              <h1 className='text-3xl md:text-4xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: C.white, lineHeight: 1 }}>
                PLAYER BATTLES
              </h1>
            </div>
          </div>
          <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 12, maxWidth: 600 }}>
            Analyze every single delivery between any batter and bowler in IPL history. Who dominates whom? 
          </p>
        </motion.div>

        {/* ── SELECTORS ── */}
        <div className='grid md:grid-cols-2 gap-8 mb-12'>
          {/* Batter Selector */}
          <div style={{ background: C.cardBg, borderRadius: 16, padding: 20, border: `1px solid ${C.cardBorder}` }}>
            <h3 style={{ fontSize: 12, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>Select Batter</h3>
            <div className='relative'>
              <Search className='absolute left-3 top-3 text-slate-500' size={18} />
              <input 
                type="text" 
                value={batterSearch} 
                onChange={(e) => setBatterSearch(e.target.value)}
                onFocus={() => setBatterSearch('')}
                className='w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50'
                placeholder="Search batter..."
              />
              {batterSearch && batterSearch !== activeBatter && (
                <div className='absolute z-10 top-full left-0 right-0 mt-2 bg-[#1A1D26] border border-white/10 rounded-lg shadow-2xl overflow-hidden'>
                  {filteredBatters.map(b => (
                    <div 
                      key={b} 
                      onClick={() => { setActiveBatter(b); setBatterSearch(b); }}
                      className='px-4 py-3 hover:bg-white/5 cursor-pointer text-sm text-white transition-colors'
                    >
                      {b}
                    </div>
                  ))}
                  {filteredBatters.length === 0 && <div className='px-4 py-3 text-sm text-slate-500'>No batter found</div>}
                </div>
              )}
            </div>
          </div>

          {/* Bowler Selector */}
          <div style={{ background: C.cardBg, borderRadius: 16, padding: 20, border: `1px solid ${C.cardBorder}` }}>
            <h3 style={{ fontSize: 12, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>Select Bowler</h3>
            <div className='relative'>
              <Search className='absolute left-3 top-3 text-slate-500' size={18} />
              <input 
                type="text" 
                value={bowlerSearch} 
                onChange={(e) => setBowlerSearch(e.target.value)}
                onFocus={() => setBowlerSearch('')}
                className='w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50'
                placeholder="Search bowler..."
              />
              {bowlerSearch && bowlerSearch !== activeBowler && (
                <div className='absolute z-10 top-full left-0 right-0 mt-2 bg-[#1A1D26] border border-white/10 rounded-lg shadow-2xl overflow-hidden'>
                  {filteredBowlers.map(b => (
                    <div 
                      key={b} 
                      onClick={() => { setActiveBowler(b); setBowlerSearch(b); }}
                      className='px-4 py-3 hover:bg-white/5 cursor-pointer text-sm text-white transition-colors'
                    >
                      {b}
                    </div>
                  ))}
                  {filteredBowlers.length === 0 && <div className='px-4 py-3 text-sm text-slate-500'>No bowler found</div>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BATTLE CARD ── */}
        <AnimatePresence mode='wait'>
          <motion.div 
            key={battleKey}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className='relative'
          >
            <div className='flex items-center justify-center mb-8'>
              <div className='flex items-center gap-6 px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md'>
                <span className='text-2xl font-black text-white'>{activeBatter}</span>
                <Swords className='text-amber-500' size={28} />
                <span className='text-2xl font-black text-white'>{activeBowler}</span>
              </div>
            </div>

            {battleStats ? (
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center text-center'>
                  <span className='text-xs uppercase tracking-[0.15em] text-slate-500 mb-2'>Runs Scored</span>
                  <span className='text-4xl font-black text-emerald-400'>{battleStats.runs}</span>
                </div>
                <div className='p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center text-center'>
                  <span className='text-xs uppercase tracking-[0.15em] text-slate-500 mb-2'>Balls Faced</span>
                  <span className='text-4xl font-black text-cyan-400'>{battleStats.balls}</span>
                </div>
                <div className='p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center text-center'>
                  <span className='text-xs uppercase tracking-[0.15em] text-slate-500 mb-2'>Strike Rate</span>
                  <span className='text-4xl font-black text-amber-400'>
                    {((battleStats.runs / Math.max(battleStats.balls, 1)) * 100).toFixed(1)}
                  </span>
                </div>
                <div className='p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center text-center'>
                  <span className='text-xs uppercase tracking-[0.15em] text-slate-500 mb-2'>Dismissals</span>
                  <span className='text-4xl font-black text-rose-500'>{battleStats.dismissals}</span>
                </div>
              </div>
            ) : (
              <div className='p-12 text-center border border-white/5 rounded-2xl bg-black/20'>
                <X size={48} className='mx-auto mb-4 text-slate-600' />
                <h3 className='text-xl font-bold text-white mb-2'>No History</h3>
                <p className='text-slate-400'>These two players have not faced each other enough in the IPL.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
