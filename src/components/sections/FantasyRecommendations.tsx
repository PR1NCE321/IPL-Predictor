'use client';

import { useEffect, useMemo, useState } from 'react';
import { teamInfo } from '@/data/mockData';
import { FantasyTeamResult, Team } from '@/types';

const teams = Object.keys(teamInfo) as Team[];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-black text-white">{value}</div>
    </div>
  );
}

export default function FantasyRecommendations() {
  const [focusTeam, setFocusTeam] = useState<Team | 'ALL'>('RCB');
  const [budget, setBudget] = useState(100);
  const [data, setData] = useState<FantasyTeamResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTeam() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (focusTeam !== 'ALL') params.set('focusTeam', focusTeam);
        params.set('budget', String(budget));

        const response = await fetch(`/api/fantasy-team?${params.toString()}`);
        const json = await response.json();
        if (!response.ok) throw new Error(json?.error || 'Failed to build fantasy team');
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to build fantasy team');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTeam();
    return () => {
      cancelled = true;
    };
  }, [focusTeam, budget]);

  const focusLabel = useMemo(() => (focusTeam === 'ALL' ? 'Balanced' : teamInfo[focusTeam].name), [focusTeam]);

  return (
    <section className="glass-card rounded-3xl p-6 md:p-8 border border-white/10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Fantasy Team Recommendations</h1>
          <p className="mt-3 text-slate-400 max-w-2xl">
            Generate a balanced fantasy XI using current form, role balance, and a focus-team boost.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Team Focus
            <select
              className="bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white"
              value={focusTeam}
              onChange={(e) => setFocusTeam(e.target.value as Team | 'ALL')}
            >
              <option value="ALL">Balanced</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {teamInfo[team].name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Budget: {budget}
            <input
              type="range"
              min={80}
              max={120}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </label>
        </div>
      </div>

      {loading && <div className="text-brand-400">Building fantasy team...</div>}
      {error && <div className="text-rose-400 text-sm">{error}</div>}

      {data && !loading && !error && (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Focus" value={focusLabel} />
              <StatCard label="Total Cost" value={`${data.totalCost}/${data.budget}`} />
              <StatCard label="Fantasy Score" value={data.totalScore.toFixed(1)} />
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="grid grid-cols-[2fr_0.7fr_0.7fr_1fr] gap-3 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400 border-b border-white/10">
                <span>Player</span>
                <span>Role</span>
                <span>Cost</span>
                <span>Fantasy Score</span>
              </div>
              <div className="divide-y divide-white/5">
                {data.players.map((player, index) => (
                  <div key={player.playerId} className={`grid grid-cols-[2fr_0.7fr_0.7fr_1fr] gap-3 px-4 py-4 items-center ${index === 0 ? 'bg-amber-500/10' : index === 1 ? 'bg-cyan-500/10' : ''}`}>
                    <div>
                      <div className="font-bold text-white">{player.name}</div>
                      <div className="text-xs text-slate-400">{teamInfo[player.team].name} • {player.reason}</div>
                    </div>
                    <span className="text-sm text-slate-200 capitalize">{player.role}</span>
                    <span className="text-sm text-white font-bold">{player.cost}</span>
                    <span className="text-sm text-cyan-300 font-bold">{player.fantasyScore}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h2 className="text-lg font-bold text-white">Captain Picks</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-400/20">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-amber-300">Captain</div>
                  <div className="mt-1 text-white font-bold">{data.captain.name}</div>
                </div>
                <div className="rounded-xl bg-cyan-500/10 p-4 border border-cyan-400/20">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Vice Captain</div>
                  <div className="mt-1 text-white font-bold">{data.viceCaptain.name}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h2 className="text-lg font-bold text-white">Bench Watch</h2>
              <div className="mt-4 space-y-3">
                {data.bench.map((player) => (
                  <div key={player.playerId} className="rounded-xl bg-slate-950/60 border border-white/5 p-3">
                    <div className="font-semibold text-white">{player.name}</div>
                    <div className="text-xs text-slate-400">{teamInfo[player.team].shortName} • {player.role} • score {player.fantasyScore}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
