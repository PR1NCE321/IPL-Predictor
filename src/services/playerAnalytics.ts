import { playerStats } from '@/data/playerStats';
import { PlayerStats, PlayerLeaderboardEntry, Team } from '@/types';

export function getTopBatsmen(count = 5): PlayerLeaderboardEntry[] {
  const batters = playerStats.filter(p => p.role === 'batter' || p.role === 'allrounder');
  const sorted = batters
    .filter(p => typeof p.runs === 'number')
    .sort((a, b) => (b.runs || 0) - (a.runs || 0))
    .slice(0, count);

  return sorted.map(p => ({ playerId: p.id, name: p.name, team: p.team, metric: 'runs', value: p.runs || 0 }));
}

export function getTopBowlers(count = 5): PlayerLeaderboardEntry[] {
  const bowlers = playerStats.filter(p => p.role === 'bowler' || p.role === 'allrounder');
  const sorted = bowlers
    .filter(p => typeof p.wickets === 'number')
    .sort((a, b) => (b.wickets || 0) - (a.wickets || 0))
    .slice(0, count);

  return sorted.map(p => ({ playerId: p.id, name: p.name, team: p.team, metric: 'wickets', value: p.wickets || 0 }));
}

export function getPlayerForm(nameOrId: string): PlayerStats | undefined {
  return playerStats.find(p => p.id === nameOrId || p.name.toLowerCase() === nameOrId.toLowerCase());
}

export function getTeamPlayers(team: Team): PlayerStats[] {
  return playerStats.filter(p => p.team === team);
}

export function searchPlayers(query: string): PlayerStats[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return playerStats.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
}
