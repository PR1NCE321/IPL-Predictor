'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { teamInfo } from '@/data/mockData';
import { Play, TrendingUp, TrendingDown, RefreshCcw, Zap, Save, Download, Sparkles, Trophy, Focus, ShieldAlert } from 'lucide-react';
import { PointsTableEntry, Team } from '@/types';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';
import { estimateWinProbability, estimateMargin, pickWeightedWinner } from '@/services/probability';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceDot } from 'recharts';

type MarginType = 'runs' | 'wickets';
interface SimulatedMatch {
  matchId: number;
  mode: 'quick' | 'deep';
  winner: Team;
  marginType?: MarginType;
  marginValue?: number;
  t1Runs?: number;
  t1Overs?: number;
  t2Runs?: number;
  t2Overs?: number;
}

export default function SimulatorPage() {
  const { matches, pointsTable: baseTable, loading } = useLiveSystemData();
  const liveMatches = useMemo(() => matches?.filter((m) => m.status === 'pending') ?? null, [matches]);

  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [simulatedMatches, setSimulatedMatches] = useState<Record<number, SimulatedMatch>>({});
  const [targetTeam, setTargetTeam] = useState<string>('NONE');
  const [hasSavedScenario, setHasSavedScenario] = useState(false);
  const [simMode, setSimMode] = useState<'quick' | 'deep'>('quick');
  const [selectedWinner, setSelectedWinner] = useState<Team | null>(null);
  const [marginType, setMarginType] = useState<MarginType>('runs');
  const [marginValue, setMarginValue] = useState<string>('');
  const [t1Runs, setT1Runs] = useState('');
  const [t1Overs, setT1Overs] = useState('20');
  const [t2Runs, setT2Runs] = useState('');
  const [t2Overs, setT2Overs] = useState('20');

  const [playoffSim, setPlayoffSim] = useState<{
    q1Winner?: Team;
    elimWinner?: Team;
    q2Winner?: Team;
    finalWinner?: Team;
  }>({});

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
      setSelectedWinner(sim.winner);
      setSimMode(sim.mode);
      if (sim.mode === 'quick') {
        setMarginType(sim.marginType || 'runs');
        setMarginValue(sim.marginValue?.toString() || '');
      } else {
        setT1Runs(sim.t1Runs?.toString() || '');
        setT1Overs(sim.t1Overs?.toString() || '20');
        setT2Runs(sim.t2Runs?.toString() || '');
        setT2Overs(sim.t2Overs?.toString() || '20');
      }
    } else {
      setSelectedWinner(null);
      setMarginType('runs');
      setMarginValue('');
      setT1Runs('');
      setT2Runs('');
      setT1Overs('20');
      setT2Overs('20');
    }
  };

  const applySimulation = (winner: Team, mType: MarginType, mValue: number) => {
    if (!currentMatch) return;
    setSimulatedMatches(prev => ({
      ...prev,
      [currentMatch.id]: { matchId: currentMatch.id, mode: 'quick', winner, marginType: mType, marginValue: mValue }
    }));
    const nextIdx = liveMatches!.findIndex(m => m.id !== currentMatch.id && !simulatedMatches[m.id]);
    if (nextIdx !== -1) handleSelectMatch(nextIdx); else setSelectedMatch(null);
  };

  const saveSimulation = () => {
    if (!currentMatch) return;
    if (simMode === 'quick' && selectedWinner && marginValue) {
      applySimulation(selectedWinner, marginType, parseInt(marginValue) || 0);
    } else if (simMode === 'deep' && selectedWinner && t1Runs && t2Runs) {
      setSimulatedMatches(prev => ({
        ...prev,
        [currentMatch.id]: {
          matchId: currentMatch.id,
          mode: 'deep',
          winner: selectedWinner,
          t1Runs: parseInt(t1Runs),
          t1Overs: parseFloat(t1Overs),
          t2Runs: parseInt(t2Runs),
          t2Overs: parseFloat(t2Overs)
        }
      }));
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
    setSimulatedMatches(newSims);
    setSelectedMatch(null);
  };

  const smartSimulateCurrent = () => {
    if (!currentMatch) return;
    const winner = pickWeightedWinner(currentMatch, baseTable || []);
    const margin = estimateMargin(currentMatch, winner);
    setSelectedWinner(winner);
    setSimMode('quick');
    setMarginType(margin.marginType);
    setMarginValue(String(margin.marginValue));
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
      const we = tableMap[sim.winner];
      const le = tableMap[loser];
      if (sim.mode === 'quick') {
        const d = sim.marginType === 'runs' ? (sim.marginValue || 0) / 20 : (sim.marginValue || 0) * 0.35;
        if (we) { const o = we.nrr * we.matches; we.matches += 1; we.wins += 1; we.points += 2; we.nrr = (o + d) / we.matches; }
        if (le) { const o = le.nrr * le.matches; le.matches += 1; le.losses += 1; le.nrr = (o - d) / le.matches; }
      } else {
        const r1 = sim.t1Runs || 0, o1 = sim.t1Overs || 20, r2 = sim.t2Runs || 0, o2 = sim.t2Overs || 20;
        const isT1W = sim.winner === match.team1;
        const e1 = tableMap[match.team1], e2 = tableMap[match.team2];
        if (e1) {
          const oo = e1.matches * 20, or = 160 * e1.matches, orc = oo * ((or / oo) - e1.nrr);
          e1.nrr = ((or + r1) / (oo + o1)) - ((orc + r2) / (oo + o2));
          e1.matches += 1;
          if (isT1W) { e1.wins += 1; e1.points += 2; } else { e1.losses += 1; }
        }
        if (e2) {
          const oo = e2.matches * 20, or = 160 * e2.matches, orc = oo * ((or / oo) - e2.nrr);
          e2.nrr = ((or + r2) / (oo + o2)) - ((orc + r1) / (oo + o1));
          e2.matches += 1;
          if (!isT1W) { e2.wins += 1; e2.points += 2; } else { e2.losses += 1; }
        }
      }
    });
    return Object.values(tableMap).sort((a, b) => b.points !== a.points ? b.points - a.points : b.nrr - a.nrr);
  }, [simulatedMatches, baseTable, liveMatches]);

  const getRankChange = (team: string) => {
    if (!baseTable) return 0;
    const old = [...baseTable].sort((a, b) => b.points !== a.points ? b.points - a.points : b.nrr - a.nrr);
    return old.findIndex(e => e.team === team) - computedTable.findIndex(e => e.team === team);
  };

  const currentSim = currentMatch ? simulatedMatches[currentMatch.id] : null;

  const wormData = useMemo(() => {
    if (!currentMatch || !currentSim) return null;
    let t1Total = 0, t2Total = 0;
    let t1OversMax = 20, t2OversMax = 20;

    if (currentSim.mode === 'deep') {
      t1Total = currentSim.t1Runs || 0;
      t2Total = currentSim.t2Runs || 0;
      t1OversMax = currentSim.t1Overs || 20;
      t2OversMax = currentSim.t2Overs || 20;
    } else {
      // Deterministic pseudo-random generation based on match ID so it doesn't jump around
      const seed = currentMatch.id * 100;
      const getRand = (s: number) => Math.abs(Math.sin(s) * 1000) % 1;

      t1Total = 160 + Math.floor(getRand(seed) * 40);
      if (currentSim.marginType === 'runs') {
        if (currentSim.winner === currentMatch.team2) {
          t2Total = t1Total + (currentSim.marginValue || 0); // t2 won by runs, so they batted first and scored more
        } else {
          t2Total = Math.max(0, t1Total - (currentSim.marginValue || 0));
        }
      } else {
        if (currentSim.winner === currentMatch.team2) {
           t2Total = t1Total + 1; // Team 2 chased it
           t2OversMax = 19.4; 
        } else {
           t2Total = t1Total;
           t1Total = t2Total + 1;
           t1OversMax = 19.4;
        }
      }
    }

    // Generate path
    const data = [];
    let r1 = 0, r2 = 0;
    let seed1 = currentMatch.id;
    let seed2 = currentMatch.id + 10;
    const getRand = (s: number) => Math.abs(Math.sin(s) * 1000) % 1;

    for (let over = 1; over <= 20; over++) {
      const o1Complete = over <= Math.floor(t1OversMax);
      const o2Complete = over <= Math.floor(t2OversMax);

      if (o1Complete) {
         seed1++;
         const rate1 = over <= 6 ? 1.2 : over <= 15 ? 0.8 : 1.5;
         r1 += (t1Total / t1OversMax) * rate1 * (0.8 + getRand(seed1) * 0.4);
      } else if (over === Math.ceil(t1OversMax)) {
         r1 = t1Total;
      } else {
         r1 = t1Total;
      }

      if (o2Complete) {
         seed2++;
         const rate2 = over <= 6 ? 1.2 : over <= 15 ? 0.8 : 1.5;
         r2 += (t2Total / t2OversMax) * rate2 * (0.8 + getRand(seed2) * 0.4);
      } else if (over === Math.ceil(t2OversMax)) {
         r2 = t2Total;
      } else {
         r2 = t2Total;
      }

      data.push({
        over,
        [currentMatch.team1]: Math.min(Math.round(r1), t1Total),
        [currentMatch.team2]: Math.min(Math.round(r2), t2Total),
      });
    }
    
    // ensure final scores are exact
    if (data[19]) {
      data[19][currentMatch.team1] = t1Total;
      data[19][currentMatch.team2] = t2Total;
    }
    
    return data;
  }, [currentMatch, currentSim]);

  if (loading || !liveMatches || !baseTable) {
    return (
      <div className='min-h-screen p-8 flex items-center justify-center'>
        <div className='w-full max-w-4xl space-y-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='skeleton h-16 w-full rounded-xl' style={{ background: '#1A1D26' }} />
          ))}
        </div>
      </div>
    );
  }

  const isSimActive = Object.keys(simulatedMatches).length > 0;
  const simulatedCount = Object.keys(simulatedMatches).length;
  const totalMatches = liveMatches.length;
  const progressPercent = totalMatches > 0 ? (simulatedCount / totalMatches) * 100 : 0;

  return (
    <div className='min-h-screen p-4 md:p-8 relative overflow-hidden'>
      {/* Premium ambient animated blobs for rich aesthetics */}
      <div className='absolute top-10 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none animate-pulse' />
      <div className='absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none' />

      <div className='max-w-7xl mx-auto space-y-8 relative z-10'>
        {/* Header Section */}
        <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1E2028] pb-6'>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className='flex items-center gap-2 mb-1.5'>
              <span className='px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'>
                Interactive Engine
              </span>
              <span className='text-xs font-semibold text-[#8890A0]'>IPL Playoff Simulator</span>
            </div>
            <h1 className='text-3xl md:text-5xl font-black tracking-tight text-[#E8E8E8]' style={{ fontFamily: 'var(--font-barlow)' }}>
              CUSTOM SCENARIO BUILDER
            </h1>
          </motion.div>

          {/* Premium Control Hub */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.2 }}
            className='flex flex-wrap items-center gap-2'
          >
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(212,175,55,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={autoSimulateAll}
              className='relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-[#0D0F14] bg-gradient-to-r from-[#D4AF37] to-[#e6c85e] shadow-lg overflow-hidden'
              style={{ fontFamily: 'var(--font-barlow)' }}
            >
              <Sparkles size={14} className='animate-spin' style={{ animationDuration: '4s' }} />
              Auto-Simulate All
            </motion.button>

            <div className='flex items-center rounded-lg p-1 bg-[#111318] border border-[#1E2028]'>
              <button
                onClick={() => {
                  localStorage.setItem('ipl_simulator_scenario_v1', JSON.stringify(simulatedMatches));
                  setHasSavedScenario(true);
                }}
                className='flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#8890A0] hover:text-[#E8E8E8] hover:bg-[#1A1D26] transition-all'
              >
                <Save size={13} /> Save
              </button>
              {hasSavedScenario && (
                <button
                  onClick={() => {
                    const s = localStorage.getItem('ipl_simulator_scenario_v1');
                    if (s) { setSimulatedMatches(JSON.parse(s)); setSelectedMatch(null); }
                  }}
                  className='flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all'
                >
                  <Download size={13} /> Load
                </button>
              )}
              {isSimActive && (
                <button
                  onClick={() => { setSimulatedMatches({}); setPlayoffSim({}); setSelectedMatch(null); }}
                  className='flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#E8003D] hover:bg-[#E8003D]/10 transition-all'
                >
                  <RefreshCcw size={13} /> Reset
                </button>
              )}
            </div>
          </motion.div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* LEFT RAIL: Interactive Fixture Picker */}
          <div className='lg:col-span-4 flex flex-col gap-4'>
            <div className='rounded-xl border border-[#1E2028] bg-[#111318]/90 backdrop-blur-md p-4 shadow-xl flex flex-col gap-3'>
              {/* Fixture status panel */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-[11px] font-bold tracking-wider text-[#8890A0] uppercase'>Pending Matches</span>
                  <span className='text-xs font-bold px-2 py-0.5 rounded bg-[#1A1D26] text-[#E8E8E8]'>
                    {simulatedCount} / {totalMatches}
                  </span>
                </div>
                {progressPercent === 100 && (
                  <span className='flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20'>
                    <Trophy size={10} /> Complete
                  </span>
                )}
              </div>

              {/* Enhanced animated progress track */}
              <div className='h-2 rounded-full bg-[#1A1D26] overflow-hidden p-0.5 border border-[#1E2028]'>
                <motion.div
                  className='h-full rounded-full bg-gradient-to-r from-[#D4AF37] via-amber-400 to-emerald-500'
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                />
              </div>

              {/* Target filter selection */}
              <div className='relative'>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(e.target.value)}
                  className='w-full py-2 pl-8 pr-3 text-xs font-semibold rounded-lg bg-[#0D0F14] border border-[#1E2028] text-[#E8E8E8] focus:border-[#D4AF37] outline-none transition-colors appearance-none cursor-pointer'
                >
                  <option value="NONE">⚡ Filter: Show All Teams</option>
                  {Object.entries(teamInfo).filter(([k]) => k !== 'TBD').map(([k, t]) => (
                    <option key={k} value={k}>{t.name} ({k})</option>
                  ))}
                </select>
                <Focus size={13} className='absolute left-2.5 top-3 text-[#8890A0] pointer-events-none' />
              </div>
            </div>

            {/* Match List Scrollbox */}
            <div className='flex-1 rounded-xl border border-[#1E2028] bg-[#111318]/40 backdrop-blur-sm p-2 overflow-y-auto max-h-[620px] space-y-2 custom-scrollbar'>
              {liveMatches.map((match, idx) => {
                const sim = simulatedMatches[match.id];
                const isSelected = selectedMatch === idx;
                const involvesTarget = targetTeam !== 'NONE' && (match.team1 === targetTeam || match.team2 === targetTeam);
                const t1 = teamInfo[match.team1];
                const t2 = teamInfo[match.team2];

                return (
                  <motion.div
                    key={match.id}
                    layoutId={`match-card-${match.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.02 }}
                  >
                    <motion.button
                      onClick={() => handleSelectMatch(idx)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className='w-full text-left p-3 rounded-lg transition-all relative overflow-hidden group border'
                      style={{
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.03))' 
                          : sim 
                          ? 'rgba(17,24,39,0.7)' 
                          : involvesTarget 
                          ? 'rgba(212,175,55,0.03)' 
                          : '#111318',
                        borderColor: isSelected 
                          ? '#D4AF37' 
                          : sim 
                          ? 'rgba(29,158,117,0.3)' 
                          : involvesTarget 
                          ? 'rgba(212,175,55,0.2)' 
                          : '#1E2028',
                      }}
                    >
                      {/* Left color bar highlight */}
                      <div 
                        className='absolute left-0 top-0 bottom-0 w-1 transition-all'
                        style={{
                          background: isSelected ? '#D4AF37' : sim ? teamInfo[sim.winner]?.color || '#1D9E75' : 'transparent'
                        }}
                      />

                      <div className='flex items-center justify-between mb-2 pl-1'>
                        <span className='text-[10px] font-bold text-[#8890A0] tracking-wider'>
                          MATCH {match.matchNumber}
                        </span>
                        {sim ? (
                          <span className='px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1'>
                            ✓ SIMULATED
                          </span>
                        ) : isSelected ? (
                          <span className='px-2 py-0.5 rounded text-[9px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 flex items-center gap-1 animate-pulse'>
                            ● EDITING
                          </span>
                        ) : null}
                      </div>

                      {/* Teams display */}
                      <div className='flex items-center justify-between px-1'>
                        {/* Team 1 */}
                        <div className='flex items-center gap-2'>
                          <div className='w-6 h-6 rounded-full overflow-hidden bg-[#0D0F14] border border-[#1E2028] p-0.5 shrink-0'>
                            <img src={t1.logo} alt={t1.shortName} className='w-full h-full object-contain' />
                          </div>
                          <span 
                            className='font-bold text-sm tracking-wide transition-colors' 
                            style={{ 
                              fontFamily: 'var(--font-barlow)', 
                              color: sim?.winner === match.team1 ? '#D4AF37' : isSelected ? '#E8E8E8' : '#8890A0' 
                            }}
                          >
                            {match.team1}
                          </span>
                        </div>

                        <span className='text-[10px] font-extrabold text-[#3D4356] italic px-1'>VS</span>

                        {/* Team 2 */}
                        <div className='flex items-center gap-2 flex-row-reverse'>
                          <div className='w-6 h-6 rounded-full overflow-hidden bg-[#0D0F14] border border-[#1E2028] p-0.5 shrink-0'>
                            <img src={t2.logo} alt={t2.shortName} className='w-full h-full object-contain' />
                          </div>
                          <span 
                            className='font-bold text-sm tracking-wide transition-colors' 
                            style={{ 
                              fontFamily: 'var(--font-barlow)', 
                              color: sim?.winner === match.team2 ? '#D4AF37' : isSelected ? '#E8E8E8' : '#8890A0' 
                            }}
                          >
                            {match.team2}
                          </span>
                        </div>
                      </div>

                      {/* Simulation result summary string */}
                      {sim && (
                        <div className='mt-2.5 pt-1.5 border-t border-[#1E2028]/60 flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-semibold'>
                          <span>{sim.winner} wins by</span>
                          <span className='font-bold text-[#E8E8E8]'>{sim.marginValue} {sim.marginType}</span>
                        </div>
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* RIGHT RAIL: Simulator Deck & Projected Live Standings Table */}
          <div className='lg:col-span-8 flex flex-col gap-6'>
            {/* Dynamic Controls Simulator Module */}
            <AnimatePresence mode='wait'>
              {currentMatch ? (
                <motion.div
                  key={currentMatch.id}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className='rounded-xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#111318] to-[#0D0F14] p-5 shadow-2xl relative overflow-hidden'
                >
                  <div className='absolute top-0 right-0 px-4 py-1 bg-[#D4AF37]/10 border-b border-l border-[#D4AF37]/20 rounded-bl-xl text-[10px] font-bold text-[#D4AF37] tracking-wider'>
                    Active Simulator Deck
                  </div>

                  <span className='text-[10px] font-bold text-[#8890A0] uppercase tracking-widest block mb-4'>
                    CONFIGURE RESULT: MATCH {currentMatch.matchNumber}
                  </span>

                  {/* Gorgeous visual Win Probability Bar */}
                  {(() => {
                    const probs = estimateWinProbability(currentMatch, baseTable || []);
                    const p1 = Math.round(probs[currentMatch.team1] || 50);
                    const p2 = Math.round(probs[currentMatch.team2] || 50);
                    const ti1 = teamInfo[currentMatch.team1];
                    const ti2 = teamInfo[currentMatch.team2];

                    return (
                      <div className='mb-6 p-3 rounded-lg bg-[#0D0F14] border border-[#1E2028] space-y-1.5'>
                        <div className='flex justify-between items-center text-xs'>
                          <span className='font-bold text-[#E8E8E8]' style={{ color: ti1.color }}>{currentMatch.team1} {p1}%</span>
                          <span className='text-[9px] font-bold text-[#3D4356] tracking-widest uppercase'>Historical+Form Signal</span>
                          <span className='font-bold text-[#E8E8E8]' style={{ color: ti2.color }}>{p2}% {currentMatch.team2}</span>
                        </div>
                        <div className='h-2.5 rounded-full overflow-hidden flex bg-[#1A1D26] p-0.5 gap-0.5 border border-[#1E2028]'>
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${p1}%` }} 
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className='h-full rounded-l-full' 
                            style={{ background: ti1.color }} 
                          />
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${p2}%` }} 
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className='h-full rounded-r-full' 
                            style={{ background: ti2.color }} 
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Interactive Winner Choice Grid */}
                  <div className='grid grid-cols-2 gap-4 mb-6'>
                    {[currentMatch.team1, currentMatch.team2].map(team => {
                      const ti = teamInfo[team];
                      const isSelected = selectedWinner === team;

                      return (
                        <motion.button
                          key={team}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedWinner(team)}
                          className='p-4 rounded-xl border text-center relative flex flex-col items-center gap-3 cursor-pointer transition-all overflow-hidden group'
                          style={{
                            background: isSelected ? 'rgba(212,175,55,0.08)' : '#111318',
                            borderColor: isSelected ? '#D4AF37' : '#1E2028',
                            boxShadow: isSelected ? '0 8px 25px rgba(212,175,55,0.15)' : 'none'
                          }}
                        >
                          {/* Inner gold glow header background */}
                          {isSelected && (
                            <motion.div 
                              layoutId='active-team-backdrop'
                              className='absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#D4AF37]/5 pointer-events-none'
                            />
                          )}

                          <div className='w-16 h-16 rounded-full bg-[#0D0F14] border-2 flex items-center justify-center p-2 relative shadow-inner transition-colors' style={{ borderColor: isSelected ? '#D4AF37' : ti.color }}>
                            <img src={ti.logo} alt={team} className='w-full h-full object-contain group-hover:scale-110 transition-transform' />
                            {isSelected && (
                              <motion.span 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                className='absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] text-[#0D0F14] rounded-full flex items-center justify-center text-xs font-black shadow-md'
                              >
                                ✓
                              </motion.span>
                            )}
                          </div>

                          <div>
                            <span className='font-black text-xl tracking-wide block' style={{ fontFamily: 'var(--font-barlow)', color: isSelected ? '#D4AF37' : '#E8E8E8' }}>
                              {ti.name}
                            </span>
                            <span className='text-[10px] text-[#8890A0] block mt-0.5'>Captain: {ti.captain?.name}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Mode Configurator Tools */}
                  <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0D0F14] p-3 rounded-lg border border-[#1E2028] mb-6'>
                    {/* Switch Toggle */}
                    <div className='flex items-center rounded-md p-1 bg-[#111318] border border-[#1E2028] shrink-0'>
                      <button
                        type='button'
                        onClick={() => setSimMode('quick')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${simMode === 'quick' ? 'bg-[#D4AF37] text-[#0D0F14] shadow' : 'text-[#8890A0] hover:text-[#E8E8E8]'}`}
                      >
                        Quick Presets
                      </button>
                      <button
                        type='button'
                        onClick={() => setSimMode('deep')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${simMode === 'deep' ? 'bg-[#D4AF37] text-[#0D0F14] shadow' : 'text-[#8890A0] hover:text-[#E8E8E8]'}`}
                      >
                        Advanced Scorecard
                      </button>
                    </div>

                    {/* Smart simulate trigger */}
                    <button
                      onClick={smartSimulateCurrent}
                      className='flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded bg-[#1A1D26] hover:bg-[#1E2028] text-[#D4AF37] border border-[#D4AF37]/20 transition-all shrink-0'
                    >
                      <Sparkles size={13} /> Suggest AI Result
                    </button>
                  </div>

                  {/* Inputs display */}
                  <AnimatePresence mode='wait'>
                    {simMode === 'quick' ? (
                      <motion.div
                        key='quick'
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className='space-y-3'
                      >
                        {/* Handy presetted margin clips */}
                        <div className='grid grid-cols-3 gap-2'>
                          {[
                            { label: 'Close (+5 Runs)', type: 'runs' as MarginType, val: 5 },
                            { label: 'Dominant (+25 Runs)', type: 'runs' as MarginType, val: 25 },
                            { label: 'Crushing (+7 Wickets)', type: 'wickets' as MarginType, val: 7 }
                          ].map(preset => (
                            <button
                              key={preset.label}
                              disabled={!selectedWinner}
                              onClick={() => applySimulation(selectedWinner!, preset.type, preset.val)}
                              className='py-2 px-3 rounded-lg bg-[#111318] hover:bg-[#1A1D26] border border-[#1E2028] text-center text-xs font-semibold text-[#8890A0] hover:text-[#E8E8E8] hover:border-[#D4AF37]/40 transition-all disabled:opacity-30 disabled:pointer-events-none'
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        {/* Custom custom margin box */}
                        <div className='flex items-center gap-2'>
                          <select
                            value={marginType}
                            onChange={(e) => setMarginType(e.target.value as MarginType)}
                            className='py-2.5 px-3 rounded-lg bg-[#111318] border border-[#1E2028] text-xs font-bold text-[#E8E8E8] outline-none focus:border-[#D4AF37]'
                          >
                            <option value='runs'>Won by Runs</option>
                            <option value='wickets'>Won by Wickets</option>
                          </select>
                          <input
                            type='number'
                            value={marginValue}
                            onChange={(e) => setMarginValue(e.target.value)}
                            placeholder='Custom margin value...'
                            className='flex-1 py-2.5 px-3 rounded-lg bg-[#111318] border border-[#1E2028] text-xs font-bold text-[#E8E8E8] outline-none focus:border-[#D4AF37]'
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key='deep'
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className='grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-[#0D0F14]/60 border border-[#1E2028]'
                      >
                        {[
                          { team: currentMatch.team1, r: t1Runs, setR: setT1Runs, o: t1Overs, setO: setT1Overs },
                          { team: currentMatch.team2, r: t2Runs, setR: setT2Runs, o: t2Overs, setO: setT2Overs }
                        ].map(config => (
                          <div key={config.team} className='space-y-2 p-2 rounded bg-[#111318] border border-[#1E2028]/60'>
                            <span className='font-bold text-xs flex items-center gap-1.5 text-[#D4AF37]' style={{ fontFamily: 'var(--font-barlow)' }}>
                              <span className='w-2 h-2 rounded-full bg-[#D4AF37]' /> {config.team} Innings
                            </span>
                            <div className='flex items-center gap-1.5'>
                              <input
                                type='number'
                                value={config.r}
                                onChange={(e) => config.setR(e.target.value)}
                                placeholder='Total Runs'
                                className='w-full py-1.5 px-2 rounded bg-[#0D0F14] border border-[#1E2028] text-xs text-[#E8E8E8] font-bold outline-none focus:border-[#D4AF37]'
                              />
                              <span className='text-[10px] text-[#3D4356]'>in</span>
                              <input
                                type='number'
                                step='0.1'
                                value={config.o}
                                onChange={(e) => config.setO(e.target.value)}
                                placeholder='Overs'
                                className='w-20 py-1.5 px-2 rounded bg-[#0D0F14] border border-[#1E2028] text-xs text-[#E8E8E8] font-bold outline-none focus:border-[#D4AF37]'
                              />
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Trigger main simulator save event */}
                  <button
                    onClick={saveSimulation}
                    disabled={!selectedWinner || (simMode === 'quick' && !marginValue) || (simMode === 'deep' && (!t1Runs || !t2Runs))}
                    className='w-full mt-5 py-3 rounded-lg font-black text-sm tracking-widest uppercase bg-[#D4AF37] hover:bg-[#e0bb43] text-[#0D0F14] shadow-xl disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-2'
                    style={{ fontFamily: 'var(--font-barlow)' }}
                  >
                    <Play size={14} fill='#0D0F14' /> Apply Simulation Result
                  </button>

                  {/* WORM CHART (Only if already simulated) */}
                  {currentSim && wormData && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='mt-6 pt-6 border-t border-[#1E2028]'
                    >
                      <h3 className='text-[10px] font-bold text-[#8890A0] uppercase tracking-widest mb-4 flex items-center gap-2'>
                        <TrendingUp size={12} className="text-[#D4AF37]" /> Simulated Innings Progression (Worm)
                      </h3>
                      <div className='h-[200px] w-full'>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={wormData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="over" tick={{ fill: '#8890A0', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#8890A0', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#1A1D26', border: '1px solid #1E2028', borderRadius: 8, fontSize: 12, color: '#E8E8E8' }}
                              itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Line type="monotone" dataKey={currentMatch.team1} stroke={teamInfo[currentMatch.team1].color} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                            <Line type="monotone" dataKey={currentMatch.team2} stroke={teamInfo[currentMatch.team2].color} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='rounded-xl border border-[#1E2028] bg-[#111318]/40 p-12 text-center flex flex-col items-center justify-center gap-3'
                >
                  <div className='w-12 h-12 rounded-full bg-[#1A1D26] flex items-center justify-center text-[#D4AF37] border border-[#1E2028]'>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <span className='font-bold text-base block text-[#E8E8E8]' style={{ fontFamily: 'var(--font-barlow)' }}>
                      NO MATCH SELECTED
                    </span>
                    <span className='text-xs text-[#8890A0] block mt-1'>
                      Click any fixture on the left rail to configure hypothetical scores, or simulate everything instantly.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Simulated Live Table Output Standings */}
            <div className='rounded-xl border border-[#1E2028] bg-[#111318] shadow-xl overflow-hidden'>
              <div className='flex items-center justify-between px-5 py-4 border-b border-[#1E2028] bg-[#1A1D26]/40'>
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-bold tracking-wider text-[#E8E8E8] uppercase flex items-center gap-1.5'>
                    <Trophy size={14} className='text-[#D4AF37]' /> Projected Live Points Table
                  </span>
                  {isSimActive && (
                    <span className='text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20'>
                      Live Simulation Active
                    </span>
                  )}
                </div>
                <span className='text-[10px] text-[#8890A0] hidden sm:block'>Top 4 Qualify for Playoffs</span>
              </div>

              {/* Grid Title bar */}
              <div className='grid grid-cols-12 gap-2 px-5 py-2.5 bg-[#0D0F14]/80 border-b border-[#1E2028] text-[10px] font-bold text-[#8890A0] uppercase tracking-wider'>
                <div className='col-span-2 sm:col-span-1'>Rank</div>
                <div className='col-span-4 sm:col-span-5'>Franchise</div>
                <div className='col-span-2 text-center'>Played</div>
                <div className='col-span-2 text-center'>Points</div>
                <div className='col-span-2 text-right'>Net RR</div>
              </div>

              {/* Rows List */}
              <div className='divide-y divide-[#1E2028]/60 relative'>
                <AnimatePresence>
                  {computedTable.map((entry, idx) => {
                    const rank = idx + 1;
                    const rc = getRankChange(entry.team);
                    const isTop4 = rank <= 4;
                    const isTarget = entry.team === targetTeam;
                    const tInfo = teamInfo[entry.team];

                    return (
                      <motion.div
                        layout
                        layoutId={`table-row-${entry.team}`}
                        key={entry.team}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center relative transition-colors ${
                          isTarget ? 'bg-[#D4AF37]/5' : 'hover:bg-[#1A1D26]/30'
                        }`}
                        style={{
                          borderLeft: isTop4 ? `3px solid ${rank === 1 ? '#D4AF37' : '#1D9E75'}` : '3px solid transparent'
                        }}
                      >
                        {/* Faint watermark numbering background */}
                        <span className='absolute right-12 top-1/2 -translate-y-1/2 text-5xl font-black text-[#E8E8E8]/[0.02] pointer-events-none select-none' style={{ fontFamily: 'var(--font-barlow)' }}>
                          {rank}
                        </span>

                        {/* Rank cell */}
                        <div className='col-span-2 sm:col-span-1 flex items-center gap-1.5'>
                          <span className={`text-xs font-bold ${rank === 1 ? 'text-[#D4AF37]' : isTop4 ? 'text-emerald-400' : 'text-[#8890A0]'}`}>
                            {rank}
                          </span>
                          {rc > 0 && <TrendingUp size={12} className='text-emerald-400 shrink-0 animate-bounce' />}
                          {rc < 0 && <TrendingDown size={12} className='text-[#E8003D] shrink-0' />}
                        </div>

                        {/* Franchise Name cell */}
                        <div className='col-span-4 sm:col-span-5 flex items-center gap-2.5'>
                          <div className='w-6 h-6 rounded-full bg-[#0D0F14] border border-[#1E2028] p-0.5 shrink-0 overflow-hidden'>
                            <img src={tInfo?.logo} alt={entry.team} className='w-full h-full object-contain' />
                          </div>
                          <span className={`font-bold text-xs sm:text-sm tracking-wide ${isTarget ? 'text-[#D4AF37]' : '#E8E8E8'}`} style={{ fontFamily: 'var(--font-barlow)' }}>
                            {entry.team}
                          </span>
                        </div>

                        {/* Matches */}
                        <div className='col-span-2 text-center text-xs text-[#8890A0] font-medium'>
                          {entry.matches}
                        </div>

                        {/* Points */}
                        <div className='col-span-2 text-center text-sm font-black text-[#E8E8E8]' style={{ fontFamily: 'var(--font-barlow)' }}>
                          {entry.points}
                        </div>

                        {/* Net RR */}
                        <div className={`col-span-2 text-right text-xs font-bold tracking-tight ${entry.nrr >= 0 ? 'text-emerald-400' : 'text-[#E8003D]'}`}>
                          {entry.nrr >= 0 ? '+' : ''}{entry.nrr.toFixed(3)}
                        </div>

                        {/* Divider Line below 4th place */}
                        {rank === 4 && (
                          <div className='absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#E8003D]/60 to-transparent pointer-events-none' />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Playoff Paths Status Summary Dashboard */}
            {isSimActive && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className='grid grid-cols-2 sm:grid-cols-5 gap-3'
              >
                {computedTable.slice(0, 5).map((entry, idx) => {
                  const rank = idx + 1;
                  const tInfo = teamInfo[entry.team];
                  const simWins = Object.values(simulatedMatches).filter(s => s.winner === entry.team).length;

                  return (
                    <div
                      key={entry.team}
                      className='p-3 rounded-xl bg-[#111318] border border-[#1E2028] flex flex-col items-center justify-center text-center relative overflow-hidden group'
                    >
                      <div className='absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent' />
                      <div className='w-7 h-7 rounded-full bg-[#0D0F14] border border-[#1E2028] p-1 mb-1.5'>
                        <img src={tInfo?.logo} alt={entry.team} className='w-full h-full object-contain' />
                      </div>
                      <span className='font-bold text-xs text-[#E8E8E8]' style={{ fontFamily: 'var(--font-barlow)' }}>
                        {entry.team}
                      </span>
                      <span className='text-[10px] text-[#8890A0] mt-0.5'>
                        {entry.points} pts {simWins > 0 ? `(+${simWins}W)` : ''}
                      </span>
                      <span className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded ${rank <= 4 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {rank <= 4 ? `Rank #${rank}` : 'In Chase'}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* 🏆 LIVE IPL PLAYOFFS BRACKET & SCENARIOS */}
            {(() => {
              const top4 = computedTable.slice(0, 4);
              const r1 = top4[0]?.team as Team | undefined;
              const r2 = top4[1]?.team as Team | undefined;
              const r3 = top4[2]?.team as Team | undefined;
              const r4 = top4[3]?.team as Team | undefined;

              const q1Win = playoffSim.q1Winner || r1;
              const q1Lose = q1Win === r1 ? r2 : r1;

              const elimWin = playoffSim.elimWinner || r3;

              const q2Win = playoffSim.q2Winner || q1Lose;

              const finalWin = playoffSim.finalWinner || q1Win;

              const renderMatchBox = (
                title: string,
                t1?: Team,
                t2?: Team,
                currentWin?: Team,
                onSelectWin?: (w: Team) => void,
                subtitle?: string
              ) => (
                <div className='rounded-xl border border-[#1E2028] bg-[#111318]/80 p-3 relative overflow-hidden flex flex-col gap-2 transition-all hover:border-[#D4AF37]/30'>
                  <div className='flex items-center justify-between border-b border-[#1E2028] pb-1.5'>
                    <span className='text-[10px] font-black text-[#D4AF37] tracking-wider uppercase'>{title}</span>
                    <span className='text-[9px] text-[#8890A0]'>{subtitle}</span>
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    {[t1, t2].map((t, i) => {
                      if (!t) return <div key={i} className='p-2 bg-[#0D0F14] rounded text-center text-[10px] text-[#3D4356]'>TBD</div>;
                      const isW = currentWin === t;
                      const info = teamInfo[t];
                      return (
                        <button
                          key={t}
                          type='button'
                          onClick={() => onSelectWin?.(t)}
                          className='p-2 rounded-lg border text-left flex items-center gap-1.5 transition-all relative overflow-hidden group cursor-pointer'
                          style={{
                            background: isW ? 'rgba(212,175,55,0.1)' : '#0D0F14',
                            borderColor: isW ? '#D4AF37' : '#1E2028',
                          }}
                        >
                          <div className='w-5 h-5 rounded-full p-0.5 shrink-0' style={{ background: '#111318' }}>
                            <img src={info?.logo} alt={t} className='w-full h-full object-contain' />
                          </div>
                          <span className='font-bold text-xs block truncate' style={{ color: isW ? '#D4AF37' : '#E8E8E8' }}>{t}</span>
                          {isW && <span className='absolute right-1 top-1 text-[8px] text-[#D4AF37]'>★</span>}
                        </button>
                      );
                    })}
                  </div>
                  {currentWin && (
                    <div className='text-[10px] text-center text-emerald-400 font-semibold pt-1 border-t border-[#1E2028]/40'>
                      Advanced: <span className='font-bold text-[#E8E8E8]'>{currentWin}</span>
                    </div>
                  )}
                </div>
              );

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className='rounded-xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#111318] to-[#05030f] p-5 shadow-2xl relative overflow-hidden mt-6'
                >
                  <div className='absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#0D0F14] rounded-bl-xl text-[10px] font-black tracking-widest uppercase shadow'>
                    🏆 Road to Final Scenarios
                  </div>

                  <div className='mb-4'>
                    <h3 className='text-lg font-black tracking-tight text-[#E8E8E8] flex items-center gap-2' style={{ fontFamily: 'var(--font-barlow)' }}>
                      <Trophy size={18} className='text-[#D4AF37]' /> PLAYOFF BRACKET PREDICTOR
                    </h3>
                    <p className='text-xs text-[#8890A0] mt-0.5'>
                      Click any team below to simulate match winners and predict the ultimate IPL 2026 Champion.
                    </p>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 relative'>
                    {/* Column 1: Qual 1 & Eliminator */}
                    <div className='flex flex-col gap-4 justify-around'>
                      {renderMatchBox(
                        'Qualifier 1', r1, r2, q1Win,
                        (w) => setPlayoffSim(p => ({ ...p, q1Winner: w, finalWinner: undefined })),
                        'Rank 1 vs Rank 2'
                      )}
                      {renderMatchBox(
                        'Eliminator', r3, r4, elimWin,
                        (w) => setPlayoffSim(p => ({ ...p, elimWinner: w, q2Winner: undefined })),
                        'Rank 3 vs Rank 4'
                      )}
                    </div>

                    {/* Column 2: Qualifier 2 */}
                    <div className='flex flex-col justify-center'>
                      {renderMatchBox(
                        'Qualifier 2', q1Lose, elimWin, q2Win,
                        (w) => setPlayoffSim(p => ({ ...p, q2Winner: w, finalWinner: undefined })),
                        'Loser Q1 vs Winner Elim'
                      )}
                    </div>

                    {/* Column 3: Final & Champion Banner */}
                    <div className='flex flex-col gap-4 justify-center'>
                      {renderMatchBox(
                        'Final', q1Win, q2Win, finalWin,
                        (w) => setPlayoffSim(p => ({ ...p, finalWinner: w })),
                        'Winner Q1 vs Winner Q2'
                      )}

                      {finalWin && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className='p-4 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 via-amber-500/10 to-[#D4AF37]/20 border-2 border-[#D4AF37] text-center relative overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                        >
                          <span className='text-[9px] font-black tracking-widest text-[#D4AF37] uppercase block mb-1'>
                            👑 PREDICTED CHAMPION
                          </span>
                          <div className='flex items-center justify-center gap-2'>
                            <div className='w-8 h-8 rounded-full bg-[#0D0F14] p-1 border-2 border-[#D4AF37]'>
                              <img src={teamInfo[finalWin]?.logo} alt={finalWin} className='w-full h-full object-contain animate-bounce' />
                            </div>
                            <span className='text-2xl font-black text-white tracking-tight' style={{ fontFamily: 'var(--font-barlow)' }}>
                              {teamInfo[finalWin]?.name}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
