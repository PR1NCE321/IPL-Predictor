'use client';

import { useEffect, useState } from 'react';
import { teamInfo } from '@/data/mockData';
import { HeadToHeadStats, Team } from '@/types';
import { TeamLogoBadge } from '@/components/common/TeamLogoBadge';

const teams = Object.keys(teamInfo) as Team[];

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-400 to-accent-400 rounded-full" style={{ width: `${Math.max(4, value)}%` }} />
      </div>
    </div>
  );
}

function getWinnerLabel(team1: Team, team2: Team, stats: HeadToHeadStats) {
  const team1Score = stats.aiPrediction?.team1WinProbability ?? stats.team1WinRate;
  const team2Score = stats.aiPrediction?.team2WinProbability ?? stats.team2WinRate;

  if (team1Score === team2Score) return 'Toss-up';
  return team1Score > team2Score ? team1 : team2;
}

export default function HeadToHeadComparison() {
  const [team1, setTeam1] = useState<Team>('RCB');
  const [team2, setTeam2] = useState<Team>('MI');
  const [stats, setStats] = useState<HeadToHeadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedTeam1 = teamInfo[team1];
  const selectedTeam2 = teamInfo[team2];

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/head-to-head?team1=${team1}&team2=${team2}`);
        const json = await response.json();
        if (!response.ok) throw new Error(json?.error || 'Failed to load comparison');
        if (!cancelled) setStats(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load comparison');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [team1, team2]);

  const winnerLabel = stats ? getWinnerLabel(team1, team2, stats) : null;
  const confidenceLabel = stats?.aiPrediction?.confidence ? stats.aiPrediction.confidence.toUpperCase() : 'MODEL';

  return (
    <section className="glass-card rounded-3xl p-6 md:p-8 border border-white/10">
      <div className="flex flex-col md:flex-row gap-4 md:items-end md:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Head-to-Head Comparison</h2>
          <p className="text-slate-400 mt-2">Compare historical results, recent form, and current table context.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Team 1
            <select className="bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white" value={team1} onChange={(e) => setTeam1(e.target.value as Team)}>
              {teams.map((team) => <option key={team} value={team}>{teamInfo[team].name}</option>)}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setTeam1(team2);
              setTeam2(team1);
            }}
            className="h-[52px] rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            aria-label="Swap teams"
          >
            Swap
          </button>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Team 2
            <select className="bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white" value={team2} onChange={(e) => setTeam2(e.target.value as Team)}>
              {teams.map((team) => <option key={team} value={team}>{teamInfo[team].name}</option>)}
            </select>
          </label>
        </div>
      </div>

      {loading && <div className="text-brand-400">Loading comparison...</div>}
      {error && <div className="text-rose-400 text-sm">{error}</div>}

      {stats && !loading && !error && (
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-6 shadow-2xl shadow-black/20">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="flex items-center gap-4 rounded-2xl bg-slate-950/60 p-4 border border-white/5">
                <TeamLogoBadge team={selectedTeam1} className="h-16 w-16 rounded-2xl shrink-0" imageClassName="h-10 w-10 object-contain" alt={`${selectedTeam1.shortName} logo`} />
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Team 1</div>
                  <div className="text-2xl font-black text-white truncate">{selectedTeam1.name}</div>
                  <div className="text-sm text-slate-400">{selectedTeam1.description}</div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-5 text-center">
                <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/80">Predicted edge</div>
                <div className="mt-1 text-2xl font-black text-white">
                  {winnerLabel === 'Toss-up' ? 'Even matchup' : `${winnerLabel} edges it`}
                </div>
                <div className="mt-2 text-xs text-slate-300">
                  {confidenceLabel} confidence · {stats.meetings} meetings
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-slate-950/60 p-4 border border-white/5 lg:justify-end">
                <div className="min-w-0 text-right">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Team 2</div>
                  <div className="text-2xl font-black text-white truncate">{selectedTeam2.name}</div>
                  <div className="text-sm text-slate-400">{selectedTeam2.description}</div>
                </div>
                <TeamLogoBadge team={selectedTeam2} className="h-16 w-16 rounded-2xl shrink-0" imageClassName="h-10 w-10 object-contain" alt={`${selectedTeam2.shortName} logo`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Bar label={`${team1} win rate`} value={stats.team1WinRate} />
              <Bar label={`${team2} win rate`} value={stats.team2WinRate} />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-slate-400 text-xs uppercase tracking-widest">Meetings</div>
                  <div className="text-2xl font-black text-white mt-1">{stats.meetings}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-slate-400 text-xs uppercase tracking-widest">Last Winner</div>
                  <div className="text-2xl font-black text-white mt-1">{stats.lastWinner || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 p-5 space-y-4">
              <h3 className="text-lg font-bold text-white">Current Context</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between"><span>{team1Info(team1).name} points</span><span className="font-bold text-white">{stats.pointsTable?.team1Points ?? 0}</span></div>
                <div className="flex justify-between"><span>{team2Info(team2).name} points</span><span className="font-bold text-white">{stats.pointsTable?.team2Points ?? 0}</span></div>
                <div className="flex justify-between"><span>{team1} qualification %</span><span className="font-bold text-white">{stats.pointsTable?.team1QualificationChance ?? 0}%</span></div>
                <div className="flex justify-between"><span>{team2} qualification %</span><span className="font-bold text-white">{stats.pointsTable?.team2QualificationChance ?? 0}%</span></div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 p-5 space-y-4">
              <h3 className="text-lg font-bold text-white">Recent Form</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-slate-300 mb-2">{team1}</div>
                  <div className="flex gap-2">
                    {stats.recentForm.team1.map((result, index) => (
                      <span key={index} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${result === 1 ? 'bg-green-500/20 text-green-300' : 'bg-rose-500/20 text-rose-300'}`}>{result === 1 ? 'W' : 'L'}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-300 mb-2">{team2}</div>
                  <div className="flex gap-2">
                    {stats.recentForm.team2.map((result, index) => (
                      <span key={index} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${result === 1 ? 'bg-green-500/20 text-green-300' : 'bg-rose-500/20 text-rose-300'}`}>{result === 1 ? 'W' : 'L'}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-5 border border-indigo-500/20 relative overflow-hidden mt-2">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <svg className="w-48 h-48 -mr-12 -mt-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/></svg>
              </div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    Advanced Probabilistic Model
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Monte Carlo simulation with dynamic reality checks (Form, Venue, Table).</p>
                </div>
                {stats.aiPrediction?.confidence && (
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    stats.aiPrediction.confidence === 'high' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    stats.aiPrediction.confidence === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {stats.aiPrediction.confidence.toUpperCase()} CONFIDENCE
                  </div>
                )}
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-white">{team1Info(team1).name}</span>
                    <span className="text-white">{team2Info(team2).name}</span>
                  </div>
                  <div className="h-4 rounded-full bg-white/5 overflow-hidden flex relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out"
                      style={{ width: `${stats.aiPrediction?.team1WinProbability || 50}%` }}
                    />
                    <div className="h-full bg-gradient-to-l from-rose-500 to-orange-500 transition-all duration-1000 ease-out flex-1" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-slate-900 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg border border-white/10">VS</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300 font-mono tracking-wider">
                    <span>{stats.aiPrediction?.team1WinProbability || 50}%</span>
                    <span>{stats.aiPrediction?.team2WinProbability || 50}%</span>
                  </div>
                </div>

                {stats.aiPrediction?.signals && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">All-Time Base Rate</div>
                        <div className="text-sm font-bold text-white">{stats.aiPrediction.signals.historical > 50 ? Math.round(stats.aiPrediction.signals.historical) : 100 - Math.round(stats.aiPrediction.signals.historical)}%</div>
                      </div>
                      {stats.aiPrediction.signals.historical !== 50 ? (
                        <div className="text-[10px] text-slate-400 mt-2">in favor of <span className="text-white font-bold">{stats.aiPrediction.signals.historical > 50 ? team1 : team2}</span></div>
                      ) : <div className="text-[10px] text-slate-500 mt-2">Neutral</div>}
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Form Adj</div>
                        <div className={`text-sm font-bold ${stats.aiPrediction.signals.formAdj > 0 ? 'text-green-400' : stats.aiPrediction.signals.formAdj < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {stats.aiPrediction.signals.formAdj > 0 ? '+' : ''}{Math.abs(stats.aiPrediction.signals.formAdj).toFixed(1)}%
                        </div>
                      </div>
                      {stats.aiPrediction.signals.formAdj !== 0 ? (
                        <div className="text-[10px] text-slate-400 mt-2">in favor of <span className="text-white font-bold">{stats.aiPrediction.signals.formAdj > 0 ? team1 : team2}</span></div>
                      ) : <div className="text-[10px] text-slate-500 mt-2">Neutral</div>}
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Venue Adj</div>
                        <div className={`text-sm font-bold ${stats.aiPrediction.signals.venueAdj > 0 ? 'text-green-400' : stats.aiPrediction.signals.venueAdj < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {stats.aiPrediction.signals.venueAdj > 0 ? '+' : ''}{Math.abs(stats.aiPrediction.signals.venueAdj).toFixed(1)}%
                        </div>
                      </div>
                      {stats.aiPrediction.signals.venueAdj !== 0 ? (
                        <div className="text-[10px] text-slate-400 mt-2">in favor of <span className="text-white font-bold">{stats.aiPrediction.signals.venueAdj > 0 ? team1 : team2}</span></div>
                      ) : <div className="text-[10px] text-slate-500 mt-2">Neutral</div>}
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Table Adj</div>
                        <div className={`text-sm font-bold ${stats.aiPrediction.signals.tableAdj > 0 ? 'text-green-400' : stats.aiPrediction.signals.tableAdj < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {stats.aiPrediction.signals.tableAdj > 0 ? '+' : ''}{Math.abs(stats.aiPrediction.signals.tableAdj).toFixed(1)}%
                        </div>
                      </div>
                      {stats.aiPrediction.signals.tableAdj !== 0 ? (
                        <div className="text-[10px] text-slate-400 mt-2">in favor of <span className="text-white font-bold">{stats.aiPrediction.signals.tableAdj > 0 ? team1 : team2}</span></div>
                      ) : <div className="text-[10px] text-slate-500 mt-2">Neutral</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function team1Info(team: Team) {
  return teamInfo[team];
}

function team2Info(team: Team) {
  return teamInfo[team];
}
