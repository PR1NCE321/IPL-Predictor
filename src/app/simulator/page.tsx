'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { teamInfo } from '@/data/mockData';
import { Play, Calendar, TrendingUp, TrendingDown, RefreshCcw, Zap, Save, Download, Target, Sparkles } from 'lucide-react';
import { Match, PointsTableEntry, Team } from '@/types';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';
import { estimateWinProbability, estimateMargin, pickWeightedWinner } from '@/services/probability';

type MarginType = 'runs' | 'wickets';
interface SimulatedMatch {
  matchId: number; mode: 'quick' | 'deep'; winner: Team;
  marginType?: MarginType; marginValue?: number;
  t1Runs?: number; t1Overs?: number; t2Runs?: number; t2Overs?: number;
}

export default function SimulatorPage() {
  const { matches, pointsTable: baseTable, loading } = useLiveSystemData();
  const liveMatches = matches?.filter((m) => m.status === 'pending') ?? null;

  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [simulatedMatches, setSimulatedMatches] = useState<Record<number, SimulatedMatch>>({});
  const [targetTeam, setTargetTeam] = useState<string>('NONE');
  const [hasSavedScenario, setHasSavedScenario] = useState(false);
  const [simMode, setSimMode] = useState<'quick' | 'deep'>('quick');
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [marginType, setMarginType] = useState<MarginType>('runs');
  const [marginValue, setMarginValue] = useState<string>('');
  const [t1Runs, setT1Runs] = useState(''); const [t1Overs, setT1Overs] = useState('20');
  const [t2Runs, setT2Runs] = useState(''); const [t2Overs, setT2Overs] = useState('20');

  const currentMatch = (selectedMatch !== null && liveMatches) ? liveMatches[selectedMatch] : null;

  useEffect(() => {
    const saved = localStorage.getItem('ipl_simulator_scenario_v1');
    if (saved) setHasSavedScenario(true);
  }, []);

  const handleSelectMatch = (idx: number) => {
    if (!liveMatches) return;
    setSelectedMatch(idx);
    const match = liveMatches[idx];
    if (simulatedMatches[match.id]) {
      const sim = simulatedMatches[match.id];
      setSelectedWinner(sim.winner); setSimMode(sim.mode);
      if (sim.mode === 'quick') { setMarginType(sim.marginType || 'runs'); setMarginValue(sim.marginValue?.toString() || ''); }
      else { setT1Runs(sim.t1Runs?.toString() || ''); setT1Overs(sim.t1Overs?.toString() || '20'); setT2Runs(sim.t2Runs?.toString() || ''); setT2Overs(sim.t2Overs?.toString() || '20'); }
    } else { setSelectedWinner(null); setMarginType('runs'); setMarginValue(''); setT1Runs(''); setT2Runs(''); setT1Overs('20'); setT2Overs('20'); }
  };

  const applySimulation = (winner: string, mType: MarginType, mValue: number) => {
    if (!currentMatch) return;
    setSimulatedMatches(prev => ({ ...prev, [currentMatch.id]: { matchId: currentMatch.id, mode: 'quick', winner, marginType: mType, marginValue: mValue } }));
    const nextIdx = liveMatches!.findIndex(m => m.id !== currentMatch.id && !simulatedMatches[m.id]);
    if (nextIdx !== -1) handleSelectMatch(nextIdx); else setSelectedMatch(null);
  };

  const saveSimulation = () => {
    if (!currentMatch) return;
    if (simMode === 'quick' && selectedWinner && marginValue) { applySimulation(selectedWinner, marginType, parseInt(marginValue) || 0); }
    else if (simMode === 'deep' && selectedWinner && t1Runs && t2Runs) {
      setSimulatedMatches(prev => ({ ...prev, [currentMatch.id]: { matchId: currentMatch.id, mode: 'deep', winner: selectedWinner, t1Runs: parseInt(t1Runs), t1Overs: parseFloat(t1Overs), t2Runs: parseInt(t2Runs), t2Overs: parseFloat(t2Overs) } }));
      const nextIdx = liveMatches!.findIndex(m => m.id !== currentMatch.id && !simulatedMatches[m.id]);
      if (nextIdx !== -1) handleSelectMatch(nextIdx); else setSelectedMatch(null);
    }
  };

  const autoSimulateAll = () => {
    if (!liveMatches) return;
    const newSims: Record<number, SimulatedMatch> = { ...simulatedMatches };
    liveMatches.forEach(match => {
      if (!newSims[match.id]) {
        const winner = pickWeightedWinner(match, baseTable || []);
        const margin = estimateMargin(match, winner);
        newSims[match.id] = { matchId: match.id, mode: 'quick', winner, marginType: margin.marginType, marginValue: margin.marginValue };
      }
    });
    setSimulatedMatches(newSims); setSelectedMatch(null);
  };

  const smartSimulateCurrent = () => {
    if (!currentMatch) return;
    const winner = pickWeightedWinner(currentMatch, baseTable || []);
    const margin = estimateMargin(currentMatch, winner);
    setSelectedWinner(winner); setSimMode('quick'); setMarginType(margin.marginType); setMarginValue(String(margin.marginValue));
    applySimulation(winner, margin.marginType, margin.marginValue);
  };

  const computedTable = useMemo(() => {
    if (!baseTable || !liveMatches) return [];
    const tableMap: Record<string, PointsTableEntry> = {};
    baseTable.forEach(entry => { tableMap[entry.team] = { ...entry }; });
    Object.values(simulatedMatches).forEach(sim => {
      const match = liveMatches.find(m => m.id === sim.matchId);
      if (!match) return;
      const loser = match.team1 === sim.winner ? match.team2 : match.team1;
      const we = tableMap[sim.winner]; const le = tableMap[loser];
      if (sim.mode === 'quick') {
        const d = sim.marginType === 'runs' ? (sim.marginValue || 0) / 20 : (sim.marginValue || 0) * 0.35;
        if (we) { const o = we.nrr * we.matches; we.matches += 1; we.wins += 1; we.points += 2; we.nrr = (o + d) / we.matches; }
        if (le) { const o = le.nrr * le.matches; le.matches += 1; le.losses += 1; le.nrr = (o - d) / le.matches; }
      } else {
        const r1 = sim.t1Runs || 0, o1 = sim.t1Overs || 20, r2 = sim.t2Runs || 0, o2 = sim.t2Overs || 20;
        const isT1W = sim.winner === match.team1;
        const e1 = tableMap[match.team1], e2 = tableMap[match.team2];
        if (e1) { const oo = e1.matches*20, or = 160*e1.matches, orc = oo*((or/oo)-e1.nrr); e1.nrr = ((or+r1)/(oo+o1))-((orc+r2)/(oo+o2)); e1.matches+=1; if(isT1W){e1.wins+=1;e1.points+=2;}else{e1.losses+=1;} }
        if (e2) { const oo = e2.matches*20, or = 160*e2.matches, orc = oo*((or/oo)-e2.nrr); e2.nrr = ((or+r2)/(oo+o2))-((orc+r1)/(oo+o1)); e2.matches+=1; if(!isT1W){e2.wins+=1;e2.points+=2;}else{e2.losses+=1;} }
      }
    });
    return Object.values(tableMap).sort((a, b) => b.points !== a.points ? b.points - a.points : b.nrr - a.nrr);
  }, [simulatedMatches, baseTable, liveMatches]);

  const getRankChange = (team: string) => {
    if (!baseTable) return 0;
    const old = [...baseTable].sort((a, b) => b.points !== a.points ? b.points - a.points : b.nrr - a.nrr);
    return old.findIndex(e => e.team === team) - computedTable.findIndex(e => e.team === team);
  };

  if (loading || !liveMatches || !baseTable) {
    return <div className='min-h-screen p-8'><div className='max-w-5xl mx-auto space-y-3'>{Array.from({length:8}).map((_,i)=><div key={i} className='skeleton h-14 w-full'/>)}</div></div>;
  }

  const isSimActive = Object.keys(simulatedMatches).length > 0;

  return (
    <div className='min-h-screen p-6 md:p-8'>
      <div className='max-w-6xl mx-auto'>
        <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className='mb-6'>
          <p className='section-label mb-2'>IPL 2026</p>
          <h1 className='text-4xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>MATCH SIMULATOR</h1>
        </motion.div>

        {/* Action Bar */}
        <div className='flex flex-wrap gap-2 mb-6'>
          <button onClick={autoSimulateAll} className='btn-simulate' style={{ width: 'auto', padding: '10px 20px', fontSize: 13 }}>
            <Zap size={14} className='inline mr-2' />AUTO-SIMULATE ALL
          </button>
          <button onClick={() => { localStorage.setItem('ipl_simulator_scenario_v1', JSON.stringify(simulatedMatches)); setHasSavedScenario(true); }} className='px-4 py-2 text-sm font-semibold rounded' style={{ background: '#1A1D26', border: '1px solid #1E2028', color: '#8890A0' }}>
            <Save size={13} className='inline mr-1' /> Save
          </button>
          {hasSavedScenario && <button onClick={() => { const s = localStorage.getItem('ipl_simulator_scenario_v1'); if(s) { setSimulatedMatches(JSON.parse(s)); setSelectedMatch(null); } }} className='px-4 py-2 text-sm font-semibold rounded' style={{ background: '#1A1D26', border: '1px solid #1E2028', color: '#8890A0' }}><Download size={13} className='inline mr-1' /> Load</button>}
          {isSimActive && <button onClick={() => { setSimulatedMatches({}); setSelectedMatch(null); }} className='px-4 py-2 text-sm font-semibold rounded' style={{ background: 'rgba(232,0,61,0.1)', border: '1px solid rgba(232,0,61,0.2)', color: '#E8003D' }}><RefreshCcw size={13} className='inline mr-1' /> Reset</button>}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Fixtures Sidebar */}
          <div className='lg:col-span-4'>
            <div className='surface-card p-4' style={{ maxHeight: 700, overflowY: 'auto' }}>
              <div className='flex items-center justify-between mb-2'>
                <p className='section-label'>FIXTURES</p>
                <span style={{ fontSize: 11, color: '#D4AF37', fontWeight: 700 }}>{Object.keys(simulatedMatches).length}/{liveMatches.length}</span>
              </div>
              {/* Progress Bar */}
              <div className='mb-3'>
                <div className='w-full h-1.5 rounded-full' style={{ background: '#1E2028' }}>
                  <motion.div className='h-full rounded-full' style={{ background: 'linear-gradient(90deg, #D4AF37, #1D9E75)' }}
                    initial={{ width: 0 }} animate={{ width: `${(Object.keys(simulatedMatches).length / Math.max(liveMatches.length, 1)) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }} />
                </div>
              </div>
              <div className='mb-3'>
                <select value={targetTeam} onChange={(e) => setTargetTeam(e.target.value)} className='w-full py-2 px-3 text-xs font-semibold rounded' style={{ background: '#0D0F14', border: '1px solid #1E2028', color: '#E8E8E8', outline: 'none' }}>
                  <option value="NONE">Focus: All Teams</option>
                  {Object.entries(teamInfo).map(([k, t]) => <option key={k} value={k}>{t.name}</option>)}
                </select>
              </div>
              <div className='space-y-2'>
                {liveMatches.map((match, idx) => {
                  const sim = simulatedMatches[match.id];
                  const isSelected = selectedMatch === idx;
                  const involvesTarget = targetTeam !== 'NONE' && (match.team1 === targetTeam || match.team2 === targetTeam);
                  const t1 = teamInfo[match.team1]; const t2 = teamInfo[match.team2];
                  return (
                    <motion.button key={match.id} onClick={() => handleSelectMatch(idx)}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      className='w-full text-left p-3 rounded transition-all' style={{
                      background: isSelected ? 'rgba(212,175,55,0.08)' : sim ? 'rgba(29,158,117,0.06)' : involvesTarget ? 'rgba(212,175,55,0.04)' : '#111318',
                      border: `1px solid ${isSelected ? 'rgba(212,175,55,0.3)' : sim ? 'rgba(29,158,117,0.2)' : '#1E2028'}`,
                      borderLeft: sim ? `3px solid ${teamInfo[sim.winner]?.color || '#1D9E75'}` : isSelected ? '3px solid #D4AF37' : undefined,
                    }}>
                      <div className='flex items-center justify-between mb-1.5'>
                        <span style={{ fontSize: 10, color: sim ? '#1D9E75' : '#3D4356', fontWeight: 700 }}>M{match.matchNumber}</span>
                        {sim && <span className='px-1.5 py-0.5 rounded' style={{ fontSize: 8, background: 'rgba(29,158,117,0.1)', color: '#1D9E75', fontWeight: 700 }}>SIMULATED</span>}
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1.5'>
                          <div className='w-5 h-5 rounded-full overflow-hidden border' style={{ borderColor: sim?.winner === match.team1 ? '#D4AF37' : '#1E2028', background: '#0D0F14' }}>
                            <img src={t1.captain?.image} alt={match.team1} className='w-full h-full object-cover'
                              onError={(e) => { (e.target as HTMLImageElement).src = t1.captain?.fallbackImage || ''; }} />
                          </div>
                          <div className='w-4 h-4 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 1 }}>
                            <img src={t1.logo} alt={match.team1} className='w-full h-full object-contain' />
                          </div>
                          <span className='font-bold text-xs' style={{ fontFamily: 'var(--font-barlow)', color: sim?.winner === match.team1 ? '#D4AF37' : '#8890A0' }}>{match.team1}</span>
                        </div>
                        <span style={{ color: '#3D4356', fontSize: 9, fontWeight: 700 }}>vs</span>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold text-xs' style={{ fontFamily: 'var(--font-barlow)', color: sim?.winner === match.team2 ? '#D4AF37' : '#8890A0' }}>{match.team2}</span>
                          <div className='w-4 h-4 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 1 }}>
                            <img src={t2.logo} alt={match.team2} className='w-full h-full object-contain' />
                          </div>
                          <div className='w-5 h-5 rounded-full overflow-hidden border' style={{ borderColor: sim?.winner === match.team2 ? '#D4AF37' : '#1E2028', background: '#0D0F14' }}>
                            <img src={t2.captain?.image} alt={match.team2} className='w-full h-full object-cover'
                              onError={(e) => { (e.target as HTMLImageElement).src = t2.captain?.fallbackImage || ''; }} />
                          </div>
                        </div>
                      </div>
                      {sim && <p style={{ fontSize: 9, color: '#1D9E75', marginTop: 4, textAlign: 'center' }}>{sim.winner} +{sim.marginValue} {sim.marginType}</p>}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Control Panel + Table */}
          <div className='lg:col-span-8 space-y-6'>
            {/* Control Panel */}
            <div className='surface-card p-6'>
              {currentMatch ? (
                <>
                  <p className='section-label mb-4'>SIMULATE MATCH {currentMatch.matchNumber} — {currentMatch.team1} vs {currentMatch.team2}</p>
                  {/* Win Probability Bar */}
                  {(() => {
                    const probs = estimateWinProbability(currentMatch, baseTable || []);
                    const prob1 = Math.round(probs[currentMatch.team1] || 50);
                    const prob2 = Math.round(probs[currentMatch.team2] || 50);
                    const ti1 = teamInfo[currentMatch.team1]; const ti2 = teamInfo[currentMatch.team2];
                    return (
                      <div className='mb-4 p-3 rounded' style={{ background: '#0D0F14', border: '1px solid #1E2028' }}>
                        <div className='flex justify-between mb-1'>
                          <span style={{ fontSize: 10, color: '#E8E8E8', fontWeight: 700 }}>{prob1}%</span>
                          <span style={{ fontSize: 8, color: '#3D4356', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI WIN PREDICTION</span>
                          <span style={{ fontSize: 10, color: '#E8E8E8', fontWeight: 700 }}>{prob2}%</span>
                        </div>
                        <div className='flex rounded overflow-hidden' style={{ height: 6 }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${prob1}%` }} transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                            style={{ background: ti1.color }} />
                          <motion.div initial={{ width: 0 }} animate={{ width: `${prob2}%` }} transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                            style={{ background: ti2.color }} />
                        </div>
                      </div>
                    );
                  })()}
                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    {[currentMatch.team1, currentMatch.team2].map(team => {
                      const ti = teamInfo[team];
                      const isSelected = selectedWinner === team;
                      return (
                        <motion.button key={team} onClick={() => setSelectedWinner(team)}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          className='p-4 rounded text-center transition-all flex flex-col items-center gap-2' style={{
                          background: isSelected ? 'rgba(212,175,55,0.1)' : '#0D0F14',
                          border: `2px solid ${isSelected ? '#D4AF37' : '#1E2028'}`,
                        }}>
                          <motion.div className='w-16 h-16 rounded-full overflow-hidden border-2'
                            animate={{ borderColor: isSelected ? '#D4AF37' : ti.color, scale: isSelected ? 1.05 : 1 }}
                            style={{ background: '#0D0F14' }}>
                            <img src={ti.captain?.image} alt={ti.captain?.name} className='w-full h-full object-cover'
                              onError={(e) => { (e.target as HTMLImageElement).src = ti.captain?.fallbackImage || ''; }} />
                          </motion.div>
                          <div className='flex items-center gap-1'>
                            <div className='w-5 h-5 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 1 }}>
                              <img src={ti.logo} alt={team} className='w-full h-full object-contain' />
                            </div>
                            <span className='font-bold' style={{ fontFamily: 'var(--font-barlow)', fontSize: 18, color: isSelected ? '#D4AF37' : '#8890A0' }}>{team}</span>
                          </div>
                          <span style={{ fontSize: 10, color: '#3D4356' }}>{ti.captain?.name}</span>
                          {isSelected && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className='text-xs font-bold' style={{ color: '#D4AF37' }}>WINNER ✓</motion.span>}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Mode Toggle */}
                  <div className='pill-toggle mb-4'>
                    <div className={`pill-toggle-item ${simMode === 'quick' ? 'active' : ''}`} onClick={() => setSimMode('quick')} style={{ position: 'relative' }}>
                      {simMode === 'quick' && <motion.div layoutId='sim-mode-pill' className='absolute inset-0 rounded' style={{ background: '#D4AF37', zIndex: 0 }} />}
                      <span className='relative z-10'>Quick</span>
                    </div>
                    <div className={`pill-toggle-item ${simMode === 'deep' ? 'active' : ''}`} onClick={() => setSimMode('deep')} style={{ position: 'relative' }}>
                      {simMode === 'deep' && <motion.div layoutId='sim-mode-pill' className='absolute inset-0 rounded' style={{ background: '#D4AF37', zIndex: 0 }} />}
                      <span className='relative z-10'>Deep NRR</span>
                    </div>
                  </div>

                  <button onClick={smartSimulateCurrent} className='w-full mb-4 p-3 rounded text-sm font-semibold flex items-center justify-center gap-2' style={{ background: '#1A1D26', border: '1px solid #1E2028', color: '#E8E8E8' }}>
                    <Sparkles size={14} style={{ color: '#D4AF37' }} /> Smart Simulate
                  </button>

                  {simMode === 'quick' ? (
                    <div className='space-y-3'>
                      <div className='grid grid-cols-3 gap-2'>
                        {[{ l: 'Close (+5R)', t: 'runs' as MarginType, v: 5 }, { l: 'Normal (+20R)', t: 'runs' as MarginType, v: 20 }, { l: 'Huge (+60R)', t: 'runs' as MarginType, v: 60 }].map(q => (
                          <button key={q.l} disabled={!selectedWinner} onClick={() => applySimulation(selectedWinner!, q.t, q.v)} className='p-2 rounded text-xs font-semibold' style={{ background: '#0D0F14', border: '1px solid #1E2028', color: selectedWinner ? '#E8E8E8' : '#3D4356', opacity: selectedWinner ? 1 : 0.5 }}>{q.l}</button>
                        ))}
                      </div>
                      <div className='flex gap-2'>
                        <select value={marginType} onChange={(e) => setMarginType(e.target.value as MarginType)} className='py-2 px-3 rounded text-sm font-semibold' style={{ background: '#0D0F14', border: '1px solid #1E2028', color: '#E8E8E8', outline: 'none', fontFamily: 'monospace' }}>
                          <option value="runs">Runs</option><option value="wickets">Wickets</option>
                        </select>
                        <input type='number' value={marginValue} onChange={(e) => setMarginValue(e.target.value)} placeholder='Margin' className='flex-1 py-2 px-3 rounded text-sm' style={{ background: '#0D0F14', border: '1px solid #1E2028', color: '#E8E8E8', outline: 'none', fontFamily: 'monospace' }} />
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      {[{ team: currentMatch.team1, runs: t1Runs, setR: setT1Runs, overs: t1Overs, setO: setT1Overs }, { team: currentMatch.team2, runs: t2Runs, setR: setT2Runs, overs: t2Overs, setO: setT2Overs }].map(x => (
                        <div key={x.team} className='flex items-center gap-2'>
                          <span className='w-12 text-sm font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#8890A0' }}>{x.team}</span>
                          <input type='number' value={x.runs} onChange={(e) => x.setR(e.target.value)} placeholder='Runs' className='flex-1 py-2 px-3 rounded text-sm' style={{ background: '#0D0F14', border: '1px solid #1E2028', color: '#E8E8E8', outline: 'none', fontFamily: 'monospace' }} />
                          <span style={{ color: '#3D4356', fontSize: 11 }}>in</span>
                          <input type='number' step="0.1" value={x.overs} onChange={(e) => x.setO(e.target.value)} placeholder='Ovs' className='w-20 py-2 px-3 rounded text-sm' style={{ background: '#0D0F14', border: '1px solid #1E2028', color: '#E8E8E8', outline: 'none', fontFamily: 'monospace' }} />
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={saveSimulation} disabled={!selectedWinner || (simMode === 'quick' && !marginValue) || (simMode === 'deep' && (!t1Runs || !t2Runs))} className='btn-simulate mt-4'>
                    <Play size={14} className='inline mr-2' />APPLY RESULT
                  </button>
                </>
              ) : (
                <div className='text-center py-12'>
                  <p className='text-lg font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#3D4356' }}>SELECT A FIXTURE</p>
                  <p style={{ color: '#3D4356', fontSize: 13, marginTop: 4 }}>Or click Auto-Simulate All above</p>
                </div>
              )}
            </div>

            {/* Dynamic Standings */}
            <div className='surface-card overflow-hidden'>
              <div className='px-4 py-3' style={{ borderBottom: '1px solid #1E2028' }}>
                <p className='section-label'>PROJECTED STANDINGS</p>
              </div>
              <div className='grid grid-cols-12 gap-2 px-4 py-2' style={{ borderBottom: '1px solid #1E2028', color: '#3D4356', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                <div className='col-span-1'>#</div><div className='col-span-4'>Team</div><div className='col-span-2 text-center'>M</div><div className='col-span-2 text-center'>Pts</div><div className='col-span-3 text-center'>NRR</div>
              </div>
              <AnimatePresence>
                {computedTable.map((entry, idx) => {
                  const rank = idx + 1;
                  const rc = getRankChange(entry.team);
                  const isTop1 = rank === 1;
                  const isQ = rank <= 4;
                  const team = teamInfo[entry.team];
                  const isTarget = entry.team === targetTeam;
                  return (
                    <motion.div layout layoutId={`sim-row-${entry.team}`} key={entry.team}
                      className={`relative grid grid-cols-12 gap-2 px-4 py-3 ${isTop1 ? 'pt-row-gold' : isQ ? 'pt-row-qualify' : ''} ${rc > 0 ? 'flash-up' : rc < 0 ? 'flash-down' : ''}`}
                      style={{ borderBottom: '1px solid #1E2028', background: isTarget ? 'rgba(212,175,55,0.06)' : undefined }}
                    >
                      <span className='ghost-rank'>{rank}</span>
                      <div className='col-span-1 flex items-center gap-1'>
                        <span style={{ color: '#3D4356', fontSize: 13, fontWeight: 700 }}>{rank}</span>
                        {rc > 0 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}><TrendingUp size={12} style={{ color: '#1D9E75' }} /></motion.div>}
                        {rc < 0 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}><TrendingDown size={12} style={{ color: '#E8003D' }} /></motion.div>}
                      </div>
                      <div className='col-span-4 flex items-center gap-2'>
                        <div className='w-5 h-5 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 2 }}>
                          <img src={team.logo} alt={entry.team} className='w-full h-full object-contain' onError={(e) => { (e.target as HTMLImageElement).src = team.fallbackLogo || ''; }} />
                        </div>
                        <span className='font-bold text-sm' style={{ fontFamily: 'var(--font-barlow)', color: isTarget ? '#D4AF37' : '#E8E8E8' }}>{entry.team}</span>
                      </div>
                      <div className='col-span-2 text-center text-sm' style={{ color: '#8890A0' }}>{entry.matches}</div>
                      <div className='col-span-2 text-center text-lg font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{entry.points}</div>
                      <div className={`col-span-3 text-center text-sm font-semibold ${entry.nrr >= 0 ? 'nrr-positive' : 'nrr-negative'}`}>{entry.nrr >= 0 ? '+' : ''}{entry.nrr.toFixed(3)}</div>
                      {rank === 4 && <motion.div className='cutoff-line absolute bottom-0 left-0 right-0' initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
                        style={{ height: 2, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Celebration Banner */}
            <AnimatePresence>
              {Object.keys(simulatedMatches).length === liveMatches.length && liveMatches.length > 0 && (
                <motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -10, opacity: 0 }}
                  className='surface-card p-5 text-center' style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.04)' }}>
                  <motion.p animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                    className='text-lg font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#D4AF37' }}>
                    🏆 ALL {liveMatches.length} MATCHES SIMULATED!
                  </motion.p>
                  <p style={{ fontSize: 12, color: '#8890A0', marginTop: 4 }}>
                    Top 4: {computedTable.slice(0, 4).map(e => e.team).join(', ')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Playoff Scenarios */}
            {isSimActive && (
              <div className='surface-card p-4'>
                <p className='section-label mb-3'>PLAYOFF SCENARIOS</p>
                <div className='grid grid-cols-2 md:grid-cols-5 gap-2'>
                  {computedTable.map((entry, idx) => {
                    const rank = idx + 1;
                    const ti = teamInfo[entry.team];
                    const remainingMatches = liveMatches.filter(m => (m.team1 === entry.team || m.team2 === entry.team) && !simulatedMatches[m.id]).length;
                    const simWins = Object.values(simulatedMatches).filter(s => s.winner === entry.team).length;
                    return (
                      <div key={entry.team} className='p-3 rounded text-center' style={{
                        background: rank <= 4 ? 'rgba(29,158,117,0.06)' : 'rgba(232,0,61,0.04)',
                        border: `1px solid ${rank <= 4 ? 'rgba(29,158,117,0.15)' : 'rgba(232,0,61,0.1)'}`,
                      }}>
                        <div className='w-6 h-6 rounded overflow-hidden mx-auto mb-1' style={{ background: '#1A1D26', padding: 1 }}>
                          <img src={ti.logo} alt={entry.team} className='w-full h-full object-contain' />
                        </div>
                        <p className='font-bold text-xs' style={{ fontFamily: 'var(--font-barlow)', color: rank <= 4 ? '#1D9E75' : '#E8003D' }}>#{rank}</p>
                        <p style={{ fontSize: 9, color: '#8890A0' }}>{entry.points}pts • {simWins}W</p>
                        {remainingMatches > 0 && <p style={{ fontSize: 8, color: '#3D4356' }}>{remainingMatches} left</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
