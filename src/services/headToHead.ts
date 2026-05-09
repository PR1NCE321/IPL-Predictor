import { completedMatches, currentPointsTable, allMatches } from '@/data/mockData';
import { HeadToHeadStats, Team } from '@/types';
import { estimateWinProbabilityDetailed } from './probability';

const VALID_TEAMS = ['MI', 'CSK', 'RCB', 'KKR', 'GT', 'DC', 'PBKS', 'LSG', 'RR', 'SRH'];

const homeKeywords: Record<string, string> = {
  MI: 'Wankhede',
  CSK: 'Chepauk',
  RCB: 'Chinnaswamy',
  KKR: 'Eden Gardens',
  GT: 'Narendra Modi Stadium',
  DC: 'Arun Jaitley Stadium',
  PBKS: 'Mohali',
  LSG: 'BRSABV',
  RR: 'Sawai Man Singh',
  SRH: 'Rajiv Gandhi',
};

function isTeam(team: string): team is Team {
  return VALID_TEAMS.includes(team);
}

export function getHeadToHeadStats(team1: Team, team2: Team): HeadToHeadStats {
  const meetings = completedMatches.filter(
    (match) =>
      (match.team1 === team1 && match.team2 === team2) ||
      (match.team1 === team2 && match.team2 === team1)
  );

  let team1Wins = 0;
  let team2Wins = 0;
  let lastWinner: Team | undefined;

  meetings.forEach((match) => {
    if (match.winner === team1) team1Wins += 1;
    if (match.winner === team2) team2Wins += 1;
    if (isTeam(match.winner || '')) lastWinner = match.winner;
  });

  const team1Recent = completedMatches
    .filter((match) => match.team1 === team1 || match.team2 === team1)
    .slice(-5)
    .map((match) => (match.winner === team1 ? 1 : 0));

  const team2Recent = completedMatches
    .filter((match) => match.team1 === team2 || match.team2 === team2)
    .slice(-5)
    .map((match) => (match.winner === team2 ? 1 : 0));

  const entry1 = currentPointsTable.find((row) => row.team === team1);
  const entry2 = currentPointsTable.find((row) => row.team === team2);

  const upcoming = allMatches.find(m => 
    m.status === 'pending' && 
    ((m.team1 === team1 && m.team2 === team2) || (m.team1 === team2 && m.team2 === team1))
  );

  const mockMatch = {
    id: upcoming ? upcoming.id : 9999,
    matchNumber: upcoming ? upcoming.matchNumber : 9999,
    team1,
    team2,
    date: upcoming ? upcoming.date : new Date().toISOString(),
    venue: upcoming ? upcoming.venue : 'Neutral',
    status: 'pending' as const,
  };

  const prediction = estimateWinProbabilityDetailed(mockMatch, currentPointsTable);

  return {
    team1,
    team2,
    meetings: meetings.length,
    team1Wins,
    team2Wins,
    team1WinRate: meetings.length ? Math.round((team1Wins / meetings.length) * 100) : 0,
    team2WinRate: meetings.length ? Math.round((team2Wins / meetings.length) * 100) : 0,
    lastWinner,
    recentForm: {
      team1: team1Recent,
      team2: team2Recent,
    },
    pointsTable: entry1 && entry2 ? {
      team1Points: entry1.points,
      team2Points: entry2.points,
      team1QualificationChance: entry1.qualificationChance,
      team2QualificationChance: entry2.qualificationChance,
    } : undefined,
    aiPrediction: {
      team1WinProbability: prediction.probabilities[team1],
      team2WinProbability: prediction.probabilities[team2],
      confidence: prediction.confidence,
      signals: prediction.signals,
    }
  };
}
