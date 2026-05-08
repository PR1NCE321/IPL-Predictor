'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { teamInfo } from '@/data/mockData';
import { Sliders, Play, Calendar, Activity, TrendingUp, TrendingDown, RefreshCcw, CheckCircle2, Zap, Save, Download, Target, Crown, Medal, Sparkles, Gauge } from 'lucide-react';
import { Match, PointsTableEntry } from '@/types';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';
import { TeamLogoBadge } from '@/components/common/TeamLogoBadge';
import { estimateWinProbability, estimateMargin, pickWeightedWinner } from '@/services/probability';

type MarginType = 'runs' | 'wickets';

interface SimulatedMatch {
  matchId: number;
  mode: 'quick' | 'deep';
  winner: string;
  marginType?: MarginType;
  marginValue?: number;
  t1Runs?: number;
  t1Overs?: number;
  t2Runs?: number;
  t2Overs?: number;
}

export default function SimulatorPage() {
  const { matches, pointsTable: baseTable, loading, error } = useLiveSystemData();
  const liveMatches = matches?.filter((match) => match.status === 'pending') ?? null;

  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [simulatedMatches, setSimulatedMatches] = useState<Record<number, SimulatedMatch>>({});
  
  // New State
  const [targetTeam, setTargetTeam] = useState<string>('NONE');
  const [hasSavedScenario, setHasSavedScenario] = useState(false);
  const [simMode, setSimMode] = useState<'quick' | 'deep'>('quick');

  // Quick Form state
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [marginType, setMarginType] = useState<MarginType>('runs');
  const [marginValue, setMarginValue] = useState<string>('');

  // Deep Form state
  const [t1Runs, setT1Runs] = useState<string>('');
  const [t1Overs, setT1Overs] = useState<string>('20');
  const [t2Runs, setT2Runs] = useState<string>('');
  const [t2Overs, setT2Overs] = useState<string>('20');

  const currentMatch = (selectedMatch !== null && liveMatches) ? liveMatches[selectedMatch] : null;
  const selectedMatchProbabilities = useMemo(() => {
    if (!currentMatch) return null;
    return estimateWinProbability(currentMatch, baseTable || []);
  }, [currentMatch, baseTable]);

  useEffect(() => {
    // Check if there's a saved scenario on mount
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

  const applySimulation = (winner: string, mType: MarginType, mValue: number) => {
    if (!currentMatch) return;
    setSimulatedMatches(prev => ({
      ...prev,
      [currentMatch.id]: {
        matchId: currentMatch.id,
        mode: 'quick',
        winner: winner,
        marginType: mType,
        marginValue: mValue,
      }
    }));
    
    const nextIdx = liveMatches!.findIndex(m => m.id !== currentMatch.id && !simulatedMatches[m.id]);
    if (nextIdx !== -1) handleSelectMatch(nextIdx);
    else setSelectedMatch(null);
  };

  const saveSimulation = () => {
    if (!currentMatch) return;
    
    if (simMode === 'quick' && selectedWinner && marginValue) {
      applySimulation(selectedWinner, marginType, parseInt(marginValue) || 0);
    } else if (simMode === 'deep' && selectedWinner && t1Runs && t2Runs && t1Overs && t2Overs) {
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
      if (nextIdx !== -1) handleSelectMatch(nextIdx);
      else setSelectedMatch(null);
    }
  };

  const clearSimulations = () => {
    setSimulatedMatches({});
    setSelectedMatch(null);
  };

  // Feature 1: Auto-Simulate Season
  const autoSimulateAll = () => {
    if (!liveMatches) return;
    const newSims: Record<number, SimulatedMatch> = { ...simulatedMatches };
    
    liveMatches.forEach(match => {
      if (!newSims[match.id]) {
        const winner = pickWeightedWinner(match, baseTable || []);
        const margin = estimateMargin(match, winner);
        
        newSims[match.id] = {
          matchId: match.id,
          mode: 'quick',
          winner,
          marginType: margin.marginType,
          marginValue: margin.marginValue
        };
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

  // Feature 2: Save / Load Scenarios
  const saveScenarioToStorage = () => {
    localStorage.setItem('ipl_simulator_scenario_v1', JSON.stringify(simulatedMatches));
    setHasSavedScenario(true);
    alert('Scenario Saved Successfully!');
  };

  const loadScenarioFromStorage = () => {
    const saved = localStorage.getItem('ipl_simulator_scenario_v1');
    if (saved) {
      setSimulatedMatches(JSON.parse(saved));
      setSelectedMatch(null);
    }
  };

  const computedTable = useMemo(() => {
    if (!baseTable || !liveMatches) return [];
    const tableMap: Record<string, PointsTableEntry> = {};
    
    baseTable.forEach(entry => { tableMap[entry.team] = { ...entry }; });

    Object.values(simulatedMatches).forEach(sim => {
      const match = liveMatches.find(m => m.id === sim.matchId);
      if (!match) return;

      const loser = match.team1 === sim.winner ? match.team2 : match.team1;
      const winnerEntry = tableMap[sim.winner];
      const loserEntry = tableMap[loser];

      if (sim.mode === 'quick') {
        const matchNrrDiff = sim.marginType === 'runs' ? (sim.marginValue || 0) / 20 : (sim.marginValue || 0) * 0.35;

        if (winnerEntry) {
          const oldTotalNrr = winnerEntry.nrr * winnerEntry.matches;
          winnerEntry.matches += 1;
          winnerEntry.wins += 1;
          winnerEntry.points += 2;
          winnerEntry.nrr = (oldTotalNrr + matchNrrDiff) / winnerEntry.matches;
          winnerEntry.qualificationChance = Math.min(100, winnerEntry.qualificationChance + 8);
        }

        if (loserEntry) {
          const oldTotalNrr = loserEntry.nrr * loserEntry.matches;
          loserEntry.matches += 1;
          loserEntry.losses += 1;
          loserEntry.nrr = (oldTotalNrr - matchNrrDiff) / loserEntry.matches;
          loserEntry.qualificationChance = Math.max(0, loserEntry.qualificationChance - 8);
        }
      } else {
        // True NRR Calculation via Reverse Engineering historicals
        const t1Runs = sim.t1Runs || 0;
        const t1Overs = sim.t1Overs || 20;
        const t2Runs = sim.t2Runs || 0;
        const t2Overs = sim.t2Overs || 20;
        
        // Figure out which entry is team1 vs team2
        const isT1Winner = sim.winner === match.team1;
        const e1 = tableMap[match.team1];
        const e2 = tableMap[match.team2];

        if (e1) {
          // Approximate historicals for True NRR Bridge
          const oldOvers = e1.matches * 20;
          const oldRuns = 160 * e1.matches; 
          const oldRunsConceded = oldOvers * ((oldRuns / oldOvers) - e1.nrr);
          
          const newRuns = oldRuns + t1Runs;
          const newOvers = oldOvers + t1Overs;
          const newRunsConceded = oldRunsConceded + t2Runs;
          const newOversBowled = oldOvers + t2Overs;
          
          e1.nrr = (newRuns / newOvers) - (newRunsConceded / newOversBowled);
          e1.matches += 1;
          if (isT1Winner) { e1.wins += 1; e1.points += 2; e1.qualificationChance += 8; }
          else { e1.losses += 1; e1.qualificationChance -= 8; }
        }

        if (e2) {
          const oldOvers = e2.matches * 20;
          const oldRuns = 160 * e2.matches; 
          const oldRunsConceded = oldOvers * ((oldRuns / oldOvers) - e2.nrr);
          
          const newRuns = oldRuns + t2Runs;
          const newOvers = oldOvers + t2Overs;
          const newRunsConceded = oldRunsConceded + t1Runs;
          const newOversBowled = oldOvers + t1Overs;
          
          e2.nrr = (newRuns / newOvers) - (newRunsConceded / newOversBowled);
          e2.matches += 1;
          if (!isT1Winner) { e2.wins += 1; e2.points += 2; e2.qualificationChance += 8; }
          else { e2.losses += 1; e2.qualificationChance -= 8; }
        }
      }
    });

    return Object.values(tableMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });
  }, [simulatedMatches, baseTable, liveMatches]);

  const getRankChange = (team: string) => {
    if (!baseTable) return 0;
    const oldSorted = [...baseTable].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });
    const oldRank = oldSorted.findIndex(e => e.team === team);
    const newRank = computedTable.findIndex(e => e.team === team);
    return oldRank - newRank; 
  };

  if (loading || !liveMatches || !baseTable) {
    return <div className="min-h-screen flex items-center justify-center text-brand-400">Loading Live Simulator Engine...</div>;
  }

  const isSimulating = Object.keys(simulatedMatches).length > 0;

  return (
    <div className='relative min-h-screen pt-24 pb-16 overflow-hidden'>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-brand-500/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-10 text-center sm:text-left flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6'
        >
          <div>
            <h1 className='text-4xl md:text-5xl font-black mb-4 tracking-tight'>
              <span className='text-gradient bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]'>
                Advanced Simulator
              </span>
            </h1>
            <p className='text-slate-400 text-lg max-w-2xl'>Simulate matches instantly, load scenarios, and visualize the dynamic path to the playoffs.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={autoSimulateAll} className='px-4 py-2 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white rounded-xl font-bold flex items-center shadow-neon transition-all'>
              <Zap className="w-4 h-4 mr-2" /> Auto-Simulate All
            </button>
            <button onClick={saveScenarioToStorage} className='px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-xl font-bold flex items-center transition-all'>
              <Save className="w-4 h-4 mr-2" /> Save
            </button>
            {hasSavedScenario && (
              <button onClick={loadScenarioFromStorage} className='px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-xl font-bold flex items-center transition-all'>
                <Download className="w-4 h-4 mr-2" /> Load
              </button>
            )}
            {isSimulating && (
              <button onClick={clearSimulations} className='px-4 py-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 rounded-xl font-bold flex items-center transition-all'>
                <RefreshCcw className="w-4 h-4 mr-2" /> Reset
              </button>
            )}
          </div>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
          
          {/* Upcoming Matches Sidebar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className='lg:col-span-4'>
            <div className='glass-card rounded-3xl p-6 h-[800px] flex flex-col'>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-brand-500/20 rounded-lg"><Calendar className="w-5 h-5 text-brand-400" /></div>
                  <h2 className='text-xl font-bold text-white'>Fixtures</h2>
                </div>
                <div className="text-xs font-bold text-brand-400 bg-brand-500/20 px-3 py-1 rounded-full">
                  {Object.keys(simulatedMatches).length} / {liveMatches.length} Done
                </div>
              </div>

              {/* Feature 3: Target Team Filter */}
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center"><Target className="w-3 h-3 mr-1"/> Path to Playoffs Focus</label>
                <select 
                  value={targetTeam} 
                  onChange={(e) => setTargetTeam(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white font-bold outline-none focus:border-brand-400"
                >
                  <option value="NONE">-- Select Favorite Team --</option>
                  {Object.entries(teamInfo).map(([key, t]) => <option key={key} value={key}>{t.name}</option>)}
                </select>
              </div>

              <div className='space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1'>
                {liveMatches.map((match, idx) => {
                  const t1 = teamInfo[match.team1];
                  const t2 = teamInfo[match.team2];
                  const isSelected = selectedMatch === idx;
                  const sim = simulatedMatches[match.id];
                  
                  // Highlight logic: If targetTeam is playing, glow their matches!
                  const involvesTarget = targetTeam !== 'NONE' && (match.team1 === targetTeam || match.team2 === targetTeam);
                  
                  return (
                    <motion.button
                      key={match.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectMatch(idx)}
                      className={`w-full p-4 rounded-2xl text-left transition-all duration-300 border relative overflow-hidden ${
                        isSelected
                          ? 'bg-brand-500/20 border-brand-500/50 shadow-neon'
                          : sim
                            ? 'bg-green-500/10 border-green-500/30'
                            : involvesTarget 
                              ? 'bg-yellow-500/10 border-yellow-500/40' // Target Highlight
                              : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {sim && <div className="absolute top-0 right-0 w-8 h-8 bg-green-500/20 rounded-bl-2xl flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-green-400" /></div>}
                      {involvesTarget && !sim && <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-500/20 rounded-bl-2xl flex items-center justify-center"><Target className="w-4 h-4 text-yellow-400 animate-pulse" /></div>}
                      
                      <div className='flex items-center justify-between mb-2 pr-4'>
                        <span className={`text-xs font-semibold ${sim ? 'text-green-400' : involvesTarget ? 'text-yellow-400' : 'text-slate-400'}`}>Match {match.matchNumber}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className="flex items-center space-x-2">
                          <TeamLogoBadge
                            team={t1}
                            className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-white/15 via-white/5 to-white/0 shadow-sm ring-1 ring-white/10"
                            imageClassName="w-4 h-4 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
                          />
                          <span className={`font-bold ${sim?.winner === match.team1 || (!sim && match.team1 === targetTeam) ? 'text-white' : 'text-slate-400'}`}>{t1.shortName}</span>
                        </div>
                        <span className="text-slate-500 text-[10px] font-black italic">VS</span>
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold ${sim?.winner === match.team2 || (!sim && match.team2 === targetTeam) ? 'text-white' : 'text-slate-400'}`}>{t2.shortName}</span>
                          <TeamLogoBadge
                            team={t2}
                            className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-white/15 via-white/5 to-white/0 shadow-sm ring-1 ring-white/10"
                            imageClassName="w-4 h-4 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
                          />
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {sim && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0, scale: 0.95 }}
                            animate={{ height: 'auto', opacity: 1, scale: 1 }}
                            exit={{ height: 0, opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="mt-3 overflow-hidden origin-top"
                          >
                            <div className="bg-gradient-to-r from-green-500/20 via-green-500/10 to-transparent border-l-2 border-green-500 py-2.5 px-4 rounded-r-lg flex flex-col justify-center">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Simulation Result</span>
                              <span className="text-sm font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                                {sim.mode === 'quick' 
                                  ? `${sim.winner} won by ${sim.marginValue} ${sim.marginType}` 
                                  : `${sim.winner} Won`}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Simulator Panel & Table */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className='lg:col-span-8 flex flex-col space-y-6'>
            
            {/* Control Panel */}
            <div className='glass-card rounded-3xl p-6 relative overflow-hidden'>
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 blur-[80px] rounded-full pointer-events-none"></div>
              
              {currentMatch ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-accent-500/20 rounded-lg"><Sliders className="w-5 h-5 text-accent-400" /></div>
                      <h2 className='text-xl font-bold text-white'>Match {currentMatch.matchNumber} Simulation</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className='p-6 bg-slate-950/50 rounded-2xl border border-white/10 flex flex-col items-center justify-center'>
                      <label className='block text-slate-300 font-semibold mb-4 text-center'>1. Select Winner</label>
                      <div className='flex items-center justify-between w-full'>
                        {[currentMatch.team1, currentMatch.team2].map((team) => (
                          <div key={team} className="flex flex-col items-center w-2/5">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedWinner(team)}
                              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-xl font-black mb-3 shadow-lg transition-all border-4 ${
                                selectedWinner === team ? 'border-brand-400 scale-110 shadow-neon' : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: teamInfo[team].color }}
                            >
                              {team}
                            </motion.button>
                          </div>
                        ))}
                        <div className='absolute left-1/2 -translate-x-1/2 text-xl font-black text-slate-700 italic top-[60%]'>VS</div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      {selectedMatchProbabilities && (
                        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-3">
                            <Gauge className="w-4 h-4 text-brand-400" />
                            Win Probability Snapshot
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between text-slate-300">
                              <span>{currentMatch.team1}</span>
                              <span className="font-bold text-white">{selectedMatchProbabilities[currentMatch.team1]}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-brand-400 to-accent-400" style={{ width: `${selectedMatchProbabilities[currentMatch.team1]}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                              <span>{currentMatch.team2}</span>
                              <span className="font-bold text-white">{selectedMatchProbabilities[currentMatch.team2]}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-accent-400 to-brand-400" style={{ width: `${selectedMatchProbabilities[currentMatch.team2]}%` }} />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2 mb-4 bg-slate-900 p-1 rounded-xl">
                        <button onClick={() => setSimMode('quick')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${simMode === 'quick' ? 'bg-brand-500/20 text-white shadow-neon' : 'text-slate-500 hover:text-white'}`}>Quick Mode</button>
                        <button onClick={() => setSimMode('deep')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${simMode === 'deep' ? 'bg-accent-500/20 text-white shadow-neon' : 'text-slate-500 hover:text-white'}`}>Deep NRR Mode</button>
                      </div>

                      <button
                        onClick={smartSimulateCurrent}
                        className="mb-4 w-full p-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-brand-500/20 transition-all"
                        disabled={!currentMatch}
                      >
                        <Sparkles className="w-4 h-4 text-accent-400" />
                        Smart Simulate This Match
                      </button>

                      {simMode === 'quick' ? (
                        <>
                          <label className='block text-slate-300 font-semibold mb-3'>2. Quick Win Margin</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                            <button onClick={() => applySimulation(selectedWinner!, 'runs', 5)} disabled={!selectedWinner} className={`p-2 rounded-lg text-sm font-bold border transition-all ${selectedWinner ? 'bg-white/5 border-white/10 hover:bg-brand-500/20 text-white' : 'opacity-50 cursor-not-allowed'}`}>Close (+5R)</button>
                            <button onClick={() => applySimulation(selectedWinner!, 'runs', 20)} disabled={!selectedWinner} className={`p-2 rounded-lg text-sm font-bold border transition-all ${selectedWinner ? 'bg-white/5 border-white/10 hover:bg-brand-500/40 text-white' : 'opacity-50 cursor-not-allowed'}`}>Normal (+20R)</button>
                            <button onClick={() => applySimulation(selectedWinner!, 'runs', 60)} disabled={!selectedWinner} className={`p-2 rounded-lg text-sm font-bold border transition-all ${selectedWinner ? 'bg-white/5 border-white/10 hover:bg-brand-500/60 shadow-neon text-white' : 'opacity-50 cursor-not-allowed'}`}>Huge (+60R)</button>
                          </div>

                          <div className="flex items-center gap-4 mb-4">
                            <div className="h-[1px] bg-white/10 flex-1"></div>
                            <span className="text-xs font-bold text-slate-500 uppercase">Or Custom</span>
                            <div className="h-[1px] bg-white/10 flex-1"></div>
                          </div>

                          <div className="flex gap-2 mb-4">
                            <select value={marginType} onChange={(e) => setMarginType(e.target.value as MarginType)} className="bg-slate-900 border border-white/10 rounded-lg p-2 text-white font-bold outline-none flex-1">
                              <option value="runs">Runs</option>
                              <option value="wickets">Wickets</option>
                            </select>
                            <input type='number' value={marginValue} onChange={(e) => setMarginValue(e.target.value)} placeholder='Margin' className='w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-white font-bold outline-none flex-1' />
                          </div>
                        </>
                      ) : (
                        <>
                          <label className='block text-accent-300 font-semibold mb-3'>2. Enter Exact Scores</label>
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="w-12 font-bold text-slate-300 text-sm">{currentMatch.team1}</span>
                            <input type='number' value={t1Runs} onChange={(e) => setT1Runs(e.target.value)} placeholder='Runs' className='w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm font-bold outline-none flex-1' />
                            <span className="text-slate-500 text-xs">in</span>
                            <input type='number' step="0.1" value={t1Overs} onChange={(e) => setT1Overs(e.target.value)} placeholder='Ovs' className='w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm font-bold outline-none flex-1' />
                          </div>
                          <div className="flex items-center space-x-2 mb-6">
                            <span className="w-12 font-bold text-slate-300 text-sm">{currentMatch.team2}</span>
                            <input type='number' value={t2Runs} onChange={(e) => setT2Runs(e.target.value)} placeholder='Runs' className='w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm font-bold outline-none flex-1' />
                            <span className="text-slate-500 text-xs">in</span>
                            <input type='number' step="0.1" value={t2Overs} onChange={(e) => setT2Overs(e.target.value)} placeholder='Ovs' className='w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm font-bold outline-none flex-1' />
                          </div>
                        </>
                      )}
                      
                      <button
                        onClick={saveSimulation}
                        disabled={!selectedWinner || (simMode === 'quick' && !marginValue) || (simMode === 'deep' && (!t1Runs || !t2Runs))}
                        className={`w-full p-3 rounded-xl font-bold flex items-center justify-center transition-all ${
                          (selectedWinner && simMode === 'quick' && marginValue) || (selectedWinner && simMode === 'deep' && t1Runs && t2Runs)
                            ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-neon cursor-pointer hover:scale-[1.02] active:scale-95' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Play className="w-4 h-4 mr-2" /> Apply Manual
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='h-full flex flex-col items-center justify-center text-center py-10'>
                  <h3 className='text-xl font-bold text-white mb-2'>Simulator Ready</h3>
                  <p className='text-slate-400 text-sm max-w-xs'>Select a match from the fixtures, or click "Auto-Simulate All" to instantly fast-forward the season!</p>
                </div>
              )}
            </div>

            {/* Feature 5: Dynamic Tiers Table */}
            <div className='glass-card rounded-3xl p-6'>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-brand-400" />
                  <h3 className="text-lg font-bold text-white">Dynamic Standings</h3>
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className='w-full whitespace-nowrap text-sm'>
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className='px-3 py-3 text-left font-semibold text-slate-400'>Pos</th>
                      <th className='px-3 py-3 text-left font-semibold text-slate-400'>Team</th>
                      <th className='px-3 py-3 text-center font-semibold text-slate-400'>P</th>
                      <th className='px-3 py-3 text-center font-semibold text-brand-400'>Pts</th>
                      <th className='px-3 py-3 text-center font-semibold text-slate-400'>NRR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence>
                      {computedTable.map((stat, idx) => {
                        const t = teamInfo[stat.team];
                        const rankChange = getRankChange(stat.team);
                        
                        // Tier Logic
                        const isQ1 = idx === 0 || idx === 1; // Top 2
                        const isEliminator = idx === 2 || idx === 3; // 3 & 4
                        const isTarget = stat.team === targetTeam;

                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={stat.team} 
                            className={`transition-colors border-l-4 ${
                              isQ1 ? 'bg-amber-500/5 border-l-amber-400 hover:bg-amber-500/10' : 
                              isEliminator ? 'bg-brand-500/5 border-l-brand-400 hover:bg-brand-500/10' : 
                              'bg-transparent border-l-transparent hover:bg-white/5 opacity-60 hover:opacity-100'
                            } ${isTarget ? 'shadow-[inset_0_0_20px_rgba(234,179,8,0.2)]' : ''}`}
                          >
                            <td className='px-3 py-3'>
                              <div className="flex items-center space-x-1 min-w-[80px]">
                                <span className={`font-black w-5 text-center text-lg ${isQ1 ? 'text-amber-400' : isEliminator ? 'text-brand-400' : 'text-slate-500'}`}>{idx + 1}</span>
                                
                                <div className="flex items-center justify-center w-5">
                                  {isQ1 && <Crown className="w-4 h-4 text-amber-400 drop-shadow-md" />}
                                  {isEliminator && <Medal className="w-4 h-4 text-brand-400 drop-shadow-md" />}
                                </div>
                                
                                <div className="flex items-center justify-center w-6">
                                  <AnimatePresence mode="popLayout">
                                    {rankChange > 0 && (
                                      <motion.div initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} className="text-green-400 font-bold flex items-center space-x-0.5">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-xs leading-none">{rankChange}</span>
                                      </motion.div>
                                    )}
                                    {rankChange < 0 && (
                                      <motion.div initial={{ scale: 0, y: -10 }} animate={{ scale: 1, y: 0 }} className="text-rose-400 font-bold flex items-center space-x-0.5">
                                        <TrendingDown className="w-3 h-3" />
                                        <span className="text-xs leading-none">{Math.abs(rankChange)}</span>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </td>
                            <td className='px-3 py-3'>
                              <div className="flex items-center space-x-3">
                                <TeamLogoBadge
                                  team={t}
                                  className={`w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-white/15 via-white/5 to-white/0 shadow-md ${isTarget ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black' : ''}`}
                                  imageClassName="w-5 h-5 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
                                />
                                <span className={`font-bold ${isTarget ? 'text-yellow-400' : 'text-white'}`}>{t.name}</span>
                              </div>
                            </td>
                            <td className='px-3 py-3 text-center text-slate-300'>{stat.matches}</td>
                            <td className={`px-3 py-3 text-center font-black text-lg ${isQ1 ? 'text-amber-400' : isEliminator ? 'text-brand-400' : 'text-slate-400'}`}>{stat.points}</td>
                            <td className='px-3 py-3 text-center font-semibold text-slate-300'>{stat.nrr > 0 ? '+' : ''}{stat.nrr.toFixed(3)}</td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
