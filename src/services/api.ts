import { Match, PointsTableEntry, Team } from '@/types';
import { completedMatches, upcomingMatches, currentPointsTable } from '@/data/mockData';
import { estimateWinProbability } from '@/services/probability';

// API key is now server-only (in .env.local / Vercel env vars).
// This file is client-safe — it never accesses keys directly.
const CACHE_KEY = 'ipl_api_cache_v4';
const CACHE_TIME_KEY = 'ipl_api_cache_time_v4';

const teamNameMap: Record<string, Team> = {
  'chennai super kings': 'CSK', 'csk': 'CSK',
  'mumbai indians': 'MI', 'mi': 'MI',
  'royal challengers bengaluru': 'RCB', 'rcb': 'RCB',
  'royal challengers bangalore': 'RCB',
  'kolkata knight riders': 'KKR', 'kkr': 'KKR',
  'gujarat titans': 'GT', 'gt': 'GT',
  'delhi capitals': 'DC', 'dc': 'DC',
  'punjab kings': 'PBKS', 'pbks': 'PBKS',
  'lucknow super giants': 'LSG', 'lsg': 'LSG',
  'rajasthan royals': 'RR', 'rr': 'RR',
  'sunrisers hyderabad': 'SRH', 'srh': 'SRH',
};

function normalizeName(value?: string) {
  return value?.trim().toLowerCase();
}

function mapTeamName(value?: string): Team | undefined {
  const normalized = normalizeName(value);
  if (!normalized) return undefined;
  return teamNameMap[normalized];
}

function parseMatchNumber(matchName?: string): number | undefined {
  if (!matchName) return undefined;

  // "53rd Match" or "Match 53"
  const m =
    matchName.match(/(\d+)(?:st|nd|rd|th)?\s+Match/i) ||
    matchName.match(/Match\s+(\d+)/i);

  return m ? Number(m[1]) : undefined;
}

function resolveWinner(apiMatch: any): Team | undefined {
  const candidateNames = [apiMatch.matchWinner, apiMatch.winner, apiMatch.status]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  for (const candidate of candidateNames) {
    for (const [fullName, shortName] of Object.entries(teamNameMap)) {
      if (candidate.match(new RegExp(`\\b${fullName}\\b`, 'i'))) return shortName;
    }
  }

  return mapTeamName(apiMatch.matchWinner);
}

// Client-side memory cache — 5 minutes aligns with the hook's poll interval.
// The server enforces a 30-min hard cooldown on external CricAPI calls.
let memCacheData_v3: any = null;
let memCacheTime_v3: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function getLiveSystemData(options: { forceRefresh?: boolean } = {}): Promise<{
  matches: Match[];
  pointsTable: PointsTableEntry[];
  isMockData?: boolean;
  updatedAt?: number;
}> {
  const { forceRefresh = false } = options;

  // 1. Check client memory cache
  if (!forceRefresh && memCacheData_v3 && Date.now() - memCacheTime_v3 < CACHE_DURATION_MS) {
    return memCacheData_v3;
  }

  // 2. Fetch from the Next.js API route (which handles CricAPI + persistence)
  try {
    const endpoint = forceRefresh ? '/api/live-data?forceRefresh=1' : '/api/live-data';
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      // data.updatedAt is the real server-side CricAPI fetch timestamp
      memCacheData_v3 = data;
      memCacheTime_v3 = Date.now();
      return data;
    }
  } catch (err) {
    console.warn('[api] Failed to reach /api/live-data. Falling back to mockData.ts');
  }

  // 3. Last-resort fallback — static mock data bundled at build time
  const fallbackData = {
    matches: [...completedMatches, ...upcomingMatches],
    pointsTable: [...currentPointsTable],
    isMockData: true,
    updatedAt: Date.now(),
  };

  memCacheData_v3 = fallbackData;
  memCacheTime_v3 = Date.now();

  return fallbackData;
}

// `estimateWinProbability` lives in `src/services/probability.ts`
