// Team Type
export type Team =
  | 'MI'
  | 'CSK'
  | 'RCB'
  | 'KKR'
  | 'GT'
  | 'DC'
  | 'PBKS'
  | 'LSG'
  | 'RR'
  | 'SRH';

export interface TeamInfo {
  id: string;
  name: string;
  shortName: Team;
  color: string;
  logo: string;
  fallbackLogo?: string;
  description: string;
  captain: {
    name: string;
    image: string;
    fallbackImage?: string;
  };
}

// Match Type
export interface Match {
  id: number;
  matchNumber: number;
  team1: Team;
  team2: Team;
  winner?: Team;
  margin?: number;
  marginType?: 'runs' | 'wickets';
  date: string;
  venue: string;
  status: 'pending' | 'live' | 'completed';
  tossWinner?: Team;
  tossChoice?: 'bat' | 'field';
  liveScore?: LiveScore;
}

export interface LiveScore {
  team: Team;
  runs: number;
  wickets: number;
  overs: number;
  requiredRunRate?: number;
  currentRunRate?: number;
  partnershipRuns?: number;
  partnershipBalls?: number;
}

// Points Table Type
export interface PointsTableEntry {
  team: Team;
  matches: number;
  wins: number;
  losses: number;
  noResults?: number;
  points: number;
  nrr: number;
  qualificationChance: number;
  recentForm?: boolean[]; // Array of recent match results (true = win, false = loss)
}

// Probability Type
export interface ProbabilityEntry {
  matchNumber: number;
  probabilities: Record<Team, number>;
}

// Simulation Type
export interface SimulationResult {
  team: Team;
  qualificationChance: number;
  top4Chance: number;
  top2Chance: number;
  eliminationChance: number;
  firstPosition: number;
}

// Scenario Type
export interface Scenario {
  id: string;
  matchId: number;
  winner: Team;
  margin: number;
  marginType: 'runs' | 'wickets';
  timestamp: number;
  name?: string;
}

// Season Type
export interface Season {
  year: number;
  startDate: string;
  endDate: string;
  totalMatches: number;
}

// Player statistics (simplified)
export interface PlayerStats {
  id: string;
  name: string;
  team: Team;
  role: 'batter' | 'bowler' | 'allrounder' | 'keeper';
  matches: number;
  runs?: number;
  highestScore?: number;
  average?: number;
  strikeRate?: number;
  wickets?: number;
  economy?: number;
  recentScores?: Array<number | string>; // e.g. [45, 10, 'DNB', 30]
}

export interface PlayerLeaderboardEntry {
  playerId: string;
  name: string;
  team: Team;
  metric: string;
  value: number;
}

export interface HeadToHeadStats {
  team1: Team;
  team2: Team;
  meetings: number;
  team1Wins: number;
  team2Wins: number;
  team1WinRate: number;
  team2WinRate: number;
  lastWinner?: Team;
  recentForm: {
    team1: number[];
    team2: number[];
  };
  pointsTable?: {
    team1Points: number;
    team2Points: number;
    team1QualificationChance: number;
    team2QualificationChance: number;
  };
  aiPrediction?: {
    team1WinProbability: number;
    team2WinProbability: number;
    confidence?: 'high' | 'medium' | 'low';
    signals?: {
      historical: number;
      venueAdj: number;
      formAdj: number;
      tableAdj: number;
      liveAdj: number;
      tossAdj: number;
    };
  };
}

export interface FantasyRecommendation {
  playerId: string;
  name: string;
  team: Team;
  role: 'batter' | 'bowler' | 'allrounder' | 'keeper';
  cost: number;
  fantasyScore: number;
  reason: string;
}

export interface FantasyTeamResult {
  budget: number;
  focusTeam?: Team;
  totalCost: number;
  totalScore: number;
  captain: FantasyRecommendation;
  viceCaptain: FantasyRecommendation;
  players: FantasyRecommendation[];
  bench: FantasyRecommendation[];
}
