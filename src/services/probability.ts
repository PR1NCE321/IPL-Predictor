import { Match, PointsTableEntry, Team } from '@/types';
import { getHistoricalWinProbability, currentPointsTable } from '@/data/mockData';

// Estimate win probabilities for a match. This is intentionally lightweight
// — it combines historical head-to-head, simple points-table adjustment,
// and a small live-game heuristic when `liveScore` is present.
export function estimateWinProbability(match: Match, pointsTable: PointsTableEntry[] = currentPointsTable): Record<Team, number> {
  // If match already decided
  if (match.status === 'completed' && match.winner) {
    const probs: Record<Team, number> = { MI: 0, CSK: 0, RCB: 0, KKR: 0, GT: 0, DC: 0, PBKS: 0, LSG: 0, RR: 0, SRH: 0 };
    probs[match.winner] = 100;
    return probs;
  }

  // Base: historical head-to-head (team1 vs team2)
  const team1 = match.team1;
  const team2 = match.team2;
  const base1 = getHistoricalWinProbability(team1, team2);
  const base2 = 100 - base1;

  // Points-table adjustment (small): use qualificationChance or points to tilt probabilities
  const entry1 = pointsTable.find((p) => p.team === team1);
  const entry2 = pointsTable.find((p) => p.team === team2);
  let adj1 = 0;
  if (entry1 && entry2) {
    const diff = (entry1.points - entry2.points) || (entry1.qualificationChance - entry2.qualificationChance) || 0;
    // scale difference into [-8, +8]
    adj1 = Math.max(-8, Math.min(8, diff * 1));
  }

  let prob1 = base1 + adj1;
  let prob2 = 100 - prob1;

  // Live adjustments when liveScore exists
  if (match.status === 'live' && match.liveScore) {
    const live = match.liveScore;
    const batting = live.team;
    // small boost if batting side's current run-rate exceeds required
    if (typeof live.currentRunRate === 'number' && typeof live.requiredRunRate === 'number' && live.requiredRunRate > 0) {
      const rrRatio = live.currentRunRate / live.requiredRunRate;
      const delta = Math.round((rrRatio - 1) * 30); // +/- up to ~30
      if (batting === team1) prob1 += delta; else prob2 += delta;
    }

    // wickets penalty for batting side
    if (typeof live.wickets === 'number') {
      const pen = live.wickets * 3; // each wicket reduces batting win chance slightly
      if (batting === team1) prob1 = Math.max(2, prob1 - pen); else prob2 = Math.max(2, prob2 - pen);
    }
  }

  // Normalize and clamp
  prob1 = Math.max(1, Math.min(99, prob1));
  prob2 = Math.max(1, Math.min(99, 100 - prob1));

  const out: Record<Team, number> = { MI: 0, CSK: 0, RCB: 0, KKR: 0, GT: 0, DC: 0, PBKS: 0, LSG: 0, RR: 0, SRH: 0 };
  out[team1] = Math.round(prob1);
  out[team2] = Math.round(prob2);
  return out;
}

export function pickWeightedWinner(match: Match, pointsTable: PointsTableEntry[] = currentPointsTable): Team {
  const probabilities = estimateWinProbability(match, pointsTable);
  const team1Chance = probabilities[match.team1] || 50;
  const team2Chance = probabilities[match.team2] || 50;
  const roll = Math.random() * (team1Chance + team2Chance);
  return roll < team1Chance ? match.team1 : match.team2;
}

export function estimateMargin(match: Match, winner: Team): { marginType: 'runs' | 'wickets'; marginValue: number } {
  const isRunsWin = Math.random() > 0.45;

  if (isRunsWin) {
    const marginValue = winner === match.team1 ? Math.floor(Math.random() * 41) + 5 : Math.floor(Math.random() * 55) + 1;
    return { marginType: 'runs', marginValue };
  }

  return {
    marginType: 'wickets',
    marginValue: Math.min(10, Math.floor(Math.random() * 7) + 1),
  };
}

export function calculateQualificationProbabilities(
  matches: Match[],
  pointsTable: PointsTableEntry[],
  iterations = 5000
): Record<Team, number> {
  const pendingMatches = matches.filter(m => m.status === 'pending' || m.status === 'live');
  
  if (pendingMatches.length === 0) {
    // Tournament is over, top 4 are 100%, rest are 0%
    const sorted = [...pointsTable].sort((a, b) => b.points !== a.points ? b.points - a.points : b.nrr - a.nrr);
    const out = {} as Record<Team, number>;
    sorted.forEach((t, idx) => out[t.team as Team] = idx < 4 ? 100 : 0);
    return out;
  }

  const qualCounts: Record<string, number> = {};
  pointsTable.forEach(p => qualCounts[p.team] = 0);

  // Pre-calculate base probabilities for speed
  const baseProbs: Record<number, number> = {};
  pendingMatches.forEach((m, idx) => {
    baseProbs[idx] = getHistoricalWinProbability(m.team1, m.team2);
  });

  for (let i = 0; i < iterations; i++) {
    const simPoints: Record<string, number> = {};
    const simNrr: Record<string, number> = {};
    
    pointsTable.forEach(p => {
      simPoints[p.team] = p.points;
      simNrr[p.team] = p.nrr; // keep current NRR as base
    });

    // Simulate all remaining matches
    for (let mIdx = 0; mIdx < pendingMatches.length; mIdx++) {
      const match = pendingMatches[mIdx];
      const probTeam1 = baseProbs[mIdx];
      const isTeam1Win = (Math.random() * 100) < probTeam1;
      const winner = isTeam1Win ? match.team1 : match.team2;
      simPoints[winner] += 2;
      
      // Add slight NRR noise so ties aren't identical every time
      simNrr[match.team1] += (Math.random() - 0.5) * 0.1;
      simNrr[match.team2] += (Math.random() - 0.5) * 0.1;
    }

    // Sort teams by points
    const sortedTeams = Object.keys(simPoints).sort((a, b) => {
      const pA = simPoints[a];
      const pB = simPoints[b];
      if (pA === pB) {
        return simNrr[b] - simNrr[a]; // Use simulated NRR for ties
      }
      return pB - pA;
    });

    // Top 4 qualify
    for (let j = 0; j < 4; j++) {
      qualCounts[sortedTeams[j]]++;
    }
  }

  const result = {} as Record<Team, number>;
  pointsTable.forEach(p => {
    result[p.team as Team] = Math.round((qualCounts[p.team] / iterations) * 100);
  });

  return result;
}
