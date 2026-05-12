import { Match, PointsTableEntry, Team } from '@/types';
import { completedMatches, upcomingMatches, currentPointsTable } from '@/data/mockData';
import { estimateWinProbability } from '@/services/probability';

export const API_KEY = process.env.NEXT_PUBLIC_CRICAPI_KEY || "bb55c7c3-1191-47a0-b38e-e676a4f4cdaf";
const BASE_URL = "https://api.cricapi.com/v1";
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

// Global cache to avoid excessive API hits (resets on full page reload)
let memCacheData_v3: any = null;
let memCacheTime_v3: number = 0;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export async function getLiveSystemData(options: { forceRefresh?: boolean } = {}): Promise<{ matches: Match[]; pointsTable: PointsTableEntry[]; isMockData?: boolean }> {
  const { forceRefresh = false } = options;

  // 1. Check Memory Cache
  if (!forceRefresh && memCacheData_v3 && Date.now() - memCacheTime_v3 < CACHE_DURATION_MS) {
    return memCacheData_v3;
  }

  // 2. Fetch from our highly optimized Next.js ISR API route
  try {
    const endpoint = forceRefresh ? '/api/live-data?forceRefresh=1' : '/api/live-data';
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      memCacheData_v3 = data;
      memCacheTime_v3 = Date.now();
      return data;
    }
  } catch (err) {
    console.log("Failed to fetch from ISR route. Falling back to mockData.ts");
  }

  // 3. Fallback to statically imported mockData.ts
  const fallbackData = {
    matches: [...completedMatches, ...upcomingMatches],
    pointsTable: [...currentPointsTable],
    isMockData: true
  };

  memCacheData_v3 = fallbackData;
  memCacheTime_v3 = Date.now();

  return fallbackData;
}

// Estimate win probabilities for a match. This is intentionally lightweight
// — it combines historical head-to-head, simple points-table adjustment,
// and a small live-game heuristic when `liveScore` is present.
// `estimateWinProbability` moved to `src/services/probability.ts`
