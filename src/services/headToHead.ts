import { completedMatches, currentPointsTable } from '@/data/mockData';
import { HeadToHeadStats, Team } from '@/types';
import aiModelWeightsRaw from '@/data/ai-model.json';

const VALID_TEAMS = ['MI', 'CSK', 'RCB', 'KKR', 'GT', 'DC', 'PBKS', 'LSG', 'RR', 'SRH'];
const aiModelWeights = aiModelWeightsRaw as any;

function relu(x: number) {
  return Math.max(0, x);
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function predictWinProbability(team1: string, team2: string): number {
  try {
    const input = new Array(22).fill(0);
    const t1Idx = VALID_TEAMS.indexOf(team1);
    const t2Idx = VALID_TEAMS.indexOf(team2);
    
    if (t1Idx !== -1) input[t1Idx] = 1;
    if (t2Idx !== -1) input[10 + t2Idx] = 1;
    
    // Assume neutral toss and pitch condition for a pure Head-to-Head forecast
    input[20] = 0.5;
    input[21] = 0.5;
    
    const w1 = aiModelWeights[0] as number[][];
    const b1 = aiModelWeights[1] as number[];
    const w2 = aiModelWeights[2] as number[][];
    const b2 = aiModelWeights[3] as number[];
    const w3 = aiModelWeights[4] as number[][];
    const b3 = aiModelWeights[5] as number[];
    
    // Layer 1
    const l1 = new Array(16).fill(0);
    for (let j = 0; j < 16; j++) {
      let sum = b1[j];
      for (let i = 0; i < 22; i++) {
        sum += input[i] * w1[i][j];
      }
      l1[j] = relu(sum);
    }
    
    // Layer 2
    const l2 = new Array(8).fill(0);
    for (let j = 0; j < 8; j++) {
      let sum = b2[j];
      for (let i = 0; i < 16; i++) {
        sum += l1[i] * w2[i][j];
      }
      l2[j] = relu(sum);
    }
    
    // Output Layer
    let output = b3[0];
    for (let i = 0; i < 8; i++) {
      output += l2[i] * w3[i][0];
    }
    
    return sigmoid(output);
  } catch (e) {
    console.error("AI Model inference failed", e);
    return 0.5; // Fallback to 50/50 if model is missing or broken
  }
}

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

  const team1Prob = predictWinProbability(team1, team2);

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
      team1WinProbability: Math.round(team1Prob * 100),
      team2WinProbability: Math.round((1 - team1Prob) * 100),
    }
  };
}
