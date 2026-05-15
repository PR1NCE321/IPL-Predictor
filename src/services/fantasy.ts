import { playerStats } from '@/data/playerStats';
import { currentPointsTable, upcomingMatches, completedMatches } from '@/data/mockData';
import { FantasyRecommendation, FantasyTeamResult, PlayerStats, Team } from '@/types';
import venueStats from '@/data/venueStats.json';

const ROLE_LIMITS = {
  keeper: { min: 1, max: 2 },
  batter: { min: 3, max: 5 },
  allrounder: { min: 1, max: 3 },
  bowler: { min: 3, max: 5 },
} as const;

const MAX_FROM_ONE_TEAM = 7;
const DEFAULT_BUDGET = 100;

function getVenueContext(matchId?: number) {
  if (!matchId) return null;
  const match = [...upcomingMatches, ...completedMatches].find(m => m.matchNumber === matchId || m.id === matchId);
  if (!match) return null;
  return match.venue.toLowerCase();
}

function normalizeScore(player: PlayerStats, focusTeam?: Team, matchId?: number): number {
  const battingComponent = (player.runs || 0) * 0.18 + (player.average || 0) * 1.35 + (player.strikeRate || 0) * 0.08;
  const bowlingComponent = (player.wickets || 0) * 2.7 + Math.max(0, (10 - (player.economy || 8))) * 1.4;
  const roleBonus = player.role === 'keeper' ? 5 : player.role === 'allrounder' ? 8 : player.role === 'bowler' ? 4 : 6;
  const recentAverage = (player.recentScores || []).reduce<number>((sum, score) => sum + (typeof score === 'number' ? score : 0), 0) / Math.max(1, (player.recentScores || []).filter((score) => typeof score === 'number').length);
  const recentBonus = recentAverage * 0.35;
  const formBonus = Math.min(12, (player.matches || 0) * 0.3);
  const focusBonus = focusTeam && player.team === focusTeam ? 7 : 0;
  const qualificationBonus = currentPointsTable.find((entry) => entry.team === player.team)?.qualificationChance || 0;

  // Venue Context Adjustments using historical data
  let venueBonus = 0;
  const venueStr = getVenueContext(matchId);
  if (venueStr) {
    const vKey = Object.keys(venueStats).find(k => k.toLowerCase().includes(venueStr) || venueStr.includes(k.toLowerCase()));
    if (vKey) {
      const vData = (venueStats as any)[vKey];
      if (vData.avgFirstInnings > 170) {
        if (player.role === 'batter' || player.role === 'keeper') venueBonus += 6;
        if (player.role === 'bowler') venueBonus -= 2;
        if (player.strikeRate && player.strikeRate > 140) venueBonus += 3;
      } else if (vData.avgFirstInnings < 155) {
        if (player.role === 'bowler') venueBonus += 6;
        if (player.role === 'allrounder') venueBonus += 4;
        if (player.role === 'batter') venueBonus -= 2;
      }
    } else {
      // Fallback heuristics
      if (venueStr.includes('chepauk') || venueStr.includes('spin')) {
        if (player.role === 'bowler' || player.role === 'allrounder') venueBonus += 4;
      } else if (venueStr.includes('chinnaswamy') || venueStr.includes('wankhede')) {
        if (player.role === 'batter' || player.role === 'keeper') venueBonus += 5;
      }
    }
  }

  return battingComponent + bowlingComponent + roleBonus + recentBonus + formBonus + focusBonus + qualificationBonus * 0.08 + venueBonus;
}

function toRecommendation(player: PlayerStats, focusTeam?: Team, matchId?: number): FantasyRecommendation {
  const score = normalizeScore(player, focusTeam, matchId);
  const cost = Math.max(6, Math.min(12, Math.round(5 + score / 12)));
  const recentNumbers = (player.recentScores || []).filter((score): score is number => typeof score === 'number');
  const recentAvg = recentNumbers.length ? Math.round(recentNumbers.reduce((sum, value) => sum + value, 0) / recentNumbers.length) : 0;
  const wickets = player.wickets || 0;
  
  const venueStr = getVenueContext(matchId);
  let venueReason = '';
  if (venueStr) {
    const vKey = Object.keys(venueStats).find(k => k.toLowerCase().includes(venueStr) || venueStr.includes(k.toLowerCase()));
    if (vKey) {
      const vData = (venueStats as any)[vKey];
      if (vData.avgFirstInnings > 170 && (player.role === 'batter' || player.role === 'keeper')) venueReason = `High-scoring venue (${vData.avgFirstInnings} avg)`;
      else if (vData.avgFirstInnings < 155 && player.role === 'bowler') venueReason = `Bowler-friendly venue`;
    }
  }

  const reasonParts = [
    venueReason || null,
    player.runs ? `${player.runs} runs` : null,
    player.wickets ? `${player.wickets} wickets` : null,
    recentAvg ? `recent avg ${recentAvg}` : null,
  ].filter(Boolean);

  return {
    playerId: player.id,
    name: player.name,
    team: player.team,
    role: player.role,
    cost,
    fantasyScore: Math.round(score * 10) / 10,
    reason: reasonParts.length ? reasonParts.join(' • ') : wickets ? `${wickets} wickets` : 'solid fantasy profile',
  };
}

function roleKey(role: PlayerStats['role']): keyof typeof ROLE_LIMITS {
  if (role === 'keeper') return 'keeper';
  if (role === 'bowler') return 'bowler';
  if (role === 'allrounder') return 'allrounder';
  return 'batter';
}

function satisfiesMinimums(selected: FantasyRecommendation[]) {
  const counts = selected.reduce<Record<keyof typeof ROLE_LIMITS, number>>(
    (acc, player) => {
      acc[roleKey(player.role)] += 1;
      return acc;
    },
    { keeper: 0, batter: 0, allrounder: 0, bowler: 0 }
  );

  return (Object.keys(ROLE_LIMITS) as Array<keyof typeof ROLE_LIMITS>).every((role) => counts[role] >= ROLE_LIMITS[role].min);
}

function withinRoleMaximums(selected: FantasyRecommendation[]) {
  const counts = selected.reduce<Record<keyof typeof ROLE_LIMITS, number>>(
    (acc, player) => {
      acc[roleKey(player.role)] += 1;
      return acc;
    },
    { keeper: 0, batter: 0, allrounder: 0, bowler: 0 }
  );

  return (Object.keys(ROLE_LIMITS) as Array<keyof typeof ROLE_LIMITS>).every((role) => counts[role] <= ROLE_LIMITS[role].max);
}

function selectBestTeam(candidates: FantasyRecommendation[], budget: number) {
  let bestTeam: FantasyRecommendation[] = [];
  let bestScore = -Infinity;

  function search(index: number, selected: FantasyRecommendation[], selectedCost: number, selectedScore: number) {
    if (selected.length > 11 || selectedCost > budget) return;

    const remaining = candidates.length - index;
    if (selected.length + remaining < 11) return;

    if (selected.length === 11) {
      if (satisfiesMinimums(selected) && withinRoleMaximums(selected) && selectedScore > bestScore) {
        bestScore = selectedScore;
        bestTeam = [...selected];
      }
      return;
    }

    if (index >= candidates.length) return;

    search(index + 1, selected, selectedCost, selectedScore);

    const player = candidates[index];
    const teamCount = selected.filter((entry) => entry.team === player.team).length;
    if (teamCount >= MAX_FROM_ONE_TEAM) return;

    selected.push(player);
    search(index + 1, selected, selectedCost + player.cost, selectedScore + player.fantasyScore);
    selected.pop();
  }

  // To avoid long running times, only search top 25 candidates
  const searchCandidates = candidates.slice(0, 25);
  search(0, [], 0, 0);
  return bestTeam;
}

function buildFallbackTeam(candidates: FantasyRecommendation[], budget: number) {
  const selected: FantasyRecommendation[] = [];
  const roleCounts: Record<keyof typeof ROLE_LIMITS, number> = { keeper: 0, batter: 0, allrounder: 0, bowler: 0 };
  const teamCounts = new Map<Team, number>();
  let totalCost = 0;

  const pickPlayer = (player: FantasyRecommendation) => {
    selected.push(player);
    totalCost += player.cost;
    roleCounts[roleKey(player.role)] += 1;
    teamCounts.set(player.team, (teamCounts.get(player.team) || 0) + 1);
  };

  for (const role of Object.keys(ROLE_LIMITS) as Array<keyof typeof ROLE_LIMITS>) {
    const minimum = ROLE_LIMITS[role].min;
    const rolePool = candidates.filter((player) => roleKey(player.role) === role);

    while (roleCounts[role] < minimum) {
      const nextPlayer = rolePool.find((player) => !selected.some((entry) => entry.playerId === player.playerId) && totalCost + player.cost <= budget && (teamCounts.get(player.team) || 0) < MAX_FROM_ONE_TEAM);
      if (!nextPlayer) break;
      pickPlayer(nextPlayer);
    }
  }

  for (const player of candidates) {
    if (selected.length >= 11) break;
    if (selected.some((entry) => entry.playerId === player.playerId)) continue;
    if (totalCost + player.cost > budget) continue;
    if ((teamCounts.get(player.team) || 0) >= MAX_FROM_ONE_TEAM) continue;

    const role = roleKey(player.role);
    if (roleCounts[role] >= ROLE_LIMITS[role].max) continue;

    pickPlayer(player);
  }

  return selected.slice(0, 11);
}

export function buildFantasyTeam(focusTeam?: Team, budget = DEFAULT_BUDGET, matchId?: number): FantasyTeamResult {
  const candidates = playerStats
    .map((player) => toRecommendation(player, focusTeam, matchId))
    .sort((a, b) => {
      const scorePerCostA = a.fantasyScore / a.cost;
      const scorePerCostB = b.fantasyScore / b.cost;
      return scorePerCostB - scorePerCostA;
    });

  const selected = selectBestTeam(candidates, budget);
  const normalizedSelected = selected.length === 11 ? selected : buildFallbackTeam(candidates, budget);
  const team = [...normalizedSelected].sort((a, b) => b.fantasyScore - a.fantasyScore);
  const captain = team[0] || candidates[0];
  const viceCaptain = team[1] || team[0] || candidates[1] || candidates[0];
  const totalCost = team.reduce((sum, player) => sum + player.cost, 0);
  const totalScore = team.reduce((sum, player) => sum + player.fantasyScore, 0);
  const bench = candidates.filter((candidate) => !team.some((player) => player.playerId === candidate.playerId)).slice(0, 15); // Expand bench

  return {
    budget,
    focusTeam,
    matchContext: matchId,
    totalCost,
    totalScore: Math.round(totalScore * 10) / 10,
    captain,
    viceCaptain,
    players: team,
    bench,
    allCandidates: candidates,
  };
}
