'use client';

import { useEffect, useMemo, useState } from 'react';
import { teamInfo } from '@/data/mockData';
import { FantasyRecommendation, FantasyTeamResult, Team } from '@/types';
import { Shield, ShieldAlert, Star, TrendingUp, RefreshCcw, Download } from 'lucide-react';

const teams = (Object.keys(teamInfo) as Team[]).filter(k => k !== 'TBD');

const ROLE_LIMITS = {
  keeper: { min: 1, max: 2 },
  batter: { min: 3, max: 5 },
  allrounder: { min: 1, max: 3 },
  bowler: { min: 3, max: 5 },
};

function StatCard({ label, value, highlight = false }: { label: string; value: string | React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'bg-amber-500/10 border-amber-400/20' : 'bg-white/5 border-white/10'}`}>
      <div className={`text-[11px] uppercase tracking-[0.2em] ${highlight ? 'text-amber-300' : 'text-slate-400'}`}>{label}</div>
      <div className={`mt-2 text-xl font-black ${highlight ? 'text-amber-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}

export default function InteractiveFantasyBuilder() {
  const [focusTeam, setFocusTeam] = useState<Team | 'ALL'>('ALL');
  const [budget, setBudget] = useState(100);
  const [matchId, setMatchId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activePlayers, setActivePlayers] = useState<FantasyRecommendation[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [viceCaptainId, setViceCaptainId] = useState<string | null>(null);
  const [allCandidates, setAllCandidates] = useState<FantasyRecommendation[]>([]);
  
  // Replace Modal State
  const [replacingPlayerId, setReplacingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadTeam() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (focusTeam !== 'ALL') params.set('focusTeam', focusTeam);
        params.set('budget', String(budget));
        if (matchId !== '') params.set('matchId', String(matchId));

        const response = await fetch(`/api/fantasy-team?${params.toString()}`);
        const json = await response.json();
        if (!response.ok) throw new Error(json?.error || 'Failed to build fantasy team');
        if (!cancelled) {
          setActivePlayers(json.players || []);
          setCaptainId(json.captain?.playerId || null);
          setViceCaptainId(json.viceCaptain?.playerId || null);
          setAllCandidates(json.allCandidates || []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to build fantasy team');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadTeam();
    return () => { cancelled = true; };
  }, [focusTeam, budget, matchId]);

  const currentCost = activePlayers.reduce((sum, p) => sum + p.cost, 0);
  
  const currentScore = activePlayers.reduce((sum, p) => {
    let pts = p.fantasyScore;
    if (p.playerId === captainId) pts *= 2;
    else if (p.playerId === viceCaptainId) pts *= 1.5;
    return sum + pts;
  }, 0);

  const roleCounts = useMemo(() => {
    const counts = { keeper: 0, batter: 0, allrounder: 0, bowler: 0 };
    activePlayers.forEach(p => counts[p.role as keyof typeof counts]++);
    return counts;
  }, [activePlayers]);

  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activePlayers.forEach(p => {
      counts[p.team] = (counts[p.team] || 0) + 1;
    });
    return counts;
  }, [activePlayers]);

  const isValid = activePlayers.length === 11 &&
                  currentCost <= budget &&
                  Object.entries(ROLE_LIMITS).every(([role, limit]) => roleCounts[role as keyof typeof ROLE_LIMITS] >= limit.min && roleCounts[role as keyof typeof ROLE_LIMITS] <= limit.max) &&
                  Object.values(teamCounts).every(count => count <= 7) &&
                  captainId && viceCaptainId && captainId !== viceCaptainId;

  const handleSwap = (newPlayer: FantasyRecommendation) => {
    if (!replacingPlayerId) return;
    setActivePlayers(prev => prev.map(p => p.playerId === replacingPlayerId ? newPlayer : p));
    if (captainId === replacingPlayerId) setCaptainId(newPlayer.playerId);
    if (viceCaptainId === replacingPlayerId) setViceCaptainId(newPlayer.playerId);
    setReplacingPlayerId(null);
  };

  const handleSetRole = (playerId: string, role: 'C' | 'VC') => {
    if (role === 'C') {
      if (viceCaptainId === playerId) setViceCaptainId(null);
      setCaptainId(playerId);
    } else {
      if (captainId === playerId) setCaptainId(null);
      setViceCaptainId(playerId);
    }
  };

  const renderProgress = (current: number, min: number, max: number, label: string) => {
    const isOk = current >= min && current <= max;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span className={isOk ? 'text-emerald-400' : 'text-rose-400'}>{current} / {min}-{max}</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full ${isOk ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, (current / max) * 100)}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <section className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 relative">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 mb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
            Interactive Team Builder <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30">PRO</span>
          </h1>
          <p className="mt-3 text-slate-400 max-w-2xl">
            Fine-tune the AI's suggestions. Assign your Captain (2x pts), Vice-Captain (1.5x pts), and swap players while managing your budget!
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Venue/Match Context
            <select className="bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={matchId} onChange={e => setMatchId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">No specific venue</option>
              <option value="1">Match 1 (Chepauk - Spin)</option>
              <option value="2">Match 2 (Chinnaswamy - Batting)</option>
              <option value="3">Match 3 (Ekana - Slow)</option>
              {/* Add real upcoming matches here if available in context */}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Team Focus
            <select className="bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-white" value={focusTeam} onChange={e => setFocusTeam(e.target.value as Team | 'ALL')}>
              <option value="ALL">Balanced</option>
              {teams.map(team => <option key={team} value={team}>{teamInfo[team].name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Budget: {budget}
            <input type="range" min={80} max={120} value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full accent-cyan-400 mt-2" />
          </label>
        </div>
      </div>

      {loading && <div className="text-cyan-400 animate-pulse">Optimizing lineup...</div>}
      {error && <div className="text-rose-400">{error}</div>}

      {!loading && !error && activePlayers.length > 0 && (
        <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-4">
              <StatCard label="Proj. Points" value={<div className="flex items-center gap-2">{currentScore.toFixed(1)} <TrendingUp className="w-5 h-5 text-emerald-400" /></div>} highlight />
              <StatCard label="Budget Rem." value={<span className={budget - currentCost < 0 ? 'text-rose-400' : ''}>{(budget - currentCost).toFixed(1)}</span>} />
              <StatCard label="Team Valid" value={isValid ? <span className="text-emerald-400 flex items-center gap-2"><Shield className="w-5 h-5" /> YES</span> : <span className="text-rose-400 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> NO</span>} />
              <div className="flex items-center justify-center">
                <button onClick={() => alert('Screenshot or download logic here!')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors border border-white/10 text-white rounded-xl px-4 py-3 font-semibold text-sm">
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/50 border border-white/10 overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-3 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 border-b border-white/10 bg-black/20">
                <span>Player</span>
                <span>Role</span>
                <span>Cost</span>
                <span>Proj Pts</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-white/5">
                {activePlayers.map(player => (
                  <div key={player.playerId} className={`grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-3 px-4 py-3 items-center hover:bg-white/5 transition-colors ${captainId === player.playerId ? 'bg-amber-500/5' : viceCaptainId === player.playerId ? 'bg-cyan-500/5' : ''}`}>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {player.name}
                        {captainId === player.playerId && <span className="bg-amber-500 text-black text-[10px] px-1.5 py-0.5 rounded font-black">C</span>}
                        {viceCaptainId === player.playerId && <span className="bg-cyan-500 text-black text-[10px] px-1.5 py-0.5 rounded font-black">VC</span>}
                      </div>
                      <div className="text-xs text-slate-400">{teamInfo[player.team].name}</div>
                    </div>
                    <span className="text-sm text-slate-300 capitalize">{player.role}</span>
                    <span className="text-sm text-white font-bold">{player.cost}</span>
                    <span className="text-sm text-cyan-400 font-bold">
                      {captainId === player.playerId ? (player.fantasyScore * 2).toFixed(1) : viceCaptainId === player.playerId ? (player.fantasyScore * 1.5).toFixed(1) : player.fantasyScore.toFixed(1)}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setReplacingPlayerId(player.playerId)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors" title="Swap Player">
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleSetRole(player.playerId, 'C')} className={`px-2 py-1 text-xs font-bold rounded-lg border ${captainId === player.playerId ? 'bg-amber-500 border-amber-500 text-black' : 'bg-transparent border-white/20 text-slate-400 hover:border-amber-500/50 hover:text-amber-300'}`}>
                        C
                      </button>
                      <button onClick={() => handleSetRole(player.playerId, 'VC')} className={`px-2 py-1 text-xs font-bold rounded-lg border ${viceCaptainId === player.playerId ? 'bg-cyan-500 border-cyan-500 text-black' : 'bg-transparent border-white/20 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300'}`}>
                        VC
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h2 className="text-lg font-bold text-white mb-4">Lineup Constraints</h2>
              <div className="space-y-4">
                {renderProgress(roleCounts.keeper, ROLE_LIMITS.keeper.min, ROLE_LIMITS.keeper.max, 'Wicket Keepers')}
                {renderProgress(roleCounts.batter, ROLE_LIMITS.batter.min, ROLE_LIMITS.batter.max, 'Batters')}
                {renderProgress(roleCounts.allrounder, ROLE_LIMITS.allrounder.min, ROLE_LIMITS.allrounder.max, 'All-Rounders')}
                {renderProgress(roleCounts.bowler, ROLE_LIMITS.bowler.min, ROLE_LIMITS.bowler.max, 'Bowlers')}
                
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Team Limits (Max 7)</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(teamCounts).map(([team, count]) => (
                      <span key={team} className={`text-xs px-2 py-1 rounded-full border ${count > 7 ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                        {team}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Swap Player Modal */}
      {replacingPlayerId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-bold text-white">Swap Player</h2>
              <button onClick={() => setReplacingPlayerId(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {allCandidates
                .filter(c => !activePlayers.some(ap => ap.playerId === c.playerId))
                .filter(c => (budget - currentCost + activePlayers.find(p => p.playerId === replacingPlayerId)!.cost) >= c.cost)
                .slice(0, 50)
                .map(candidate => (
                <div key={candidate.playerId} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/50 transition-colors">
                  <div>
                    <div className="font-bold text-white">{candidate.name}</div>
                    <div className="text-xs text-slate-400">{candidate.team} • {candidate.role}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{candidate.cost} Cr</div>
                      <div className="text-xs text-cyan-400">{candidate.fantasyScore} pts</div>
                    </div>
                    <button onClick={() => handleSwap(candidate)} className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                      Pick
                    </button>
                  </div>
                </div>
              ))}
              {allCandidates.filter(c => !activePlayers.some(ap => ap.playerId === c.playerId)).length === 0 && (
                <div className="text-center p-8 text-slate-400">No affordable players available to swap.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
