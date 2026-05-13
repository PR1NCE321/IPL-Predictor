import { NextResponse } from 'next/server';
import { completedMatches, upcomingMatches, currentPointsTable } from '@/data/mockData';
import { estimateWinProbability, calculateQualificationProbabilities } from '@/services/probability';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const EXTERNAL_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

let serverSnapshot:
  | {
      matches: any[];
      pointsTable: any[];
      updatedAt: number;
      isMockData: boolean;
    }
  | null = null;

// ── Fix 4: API keys from environment (never hardcoded) ──────────────────────
const API_KEYS = [
  process.env.CRICAPI_KEY_1,
  process.env.CRICAPI_KEY_2,
  process.env.CRICAPI_KEY_3,
].filter(Boolean) as string[];

// Fallback for local dev if .env.local is missing
if (API_KEYS.length === 0) {
  console.warn('[live-data] No CRICAPI_KEY_* env vars found. API calls will fail.');
}

const BASE_URL = "https://api.cricapi.com/v1";

// ── Fix 1: Vercel-compatible file path ──────────────────────────────────────
// On Vercel serverless, `public/` is read-only. `/tmp` is writable per-instance.
// Locally, we use `public/liveData.json` so it's accessible and visible.
function getLiveDataPath(): string {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
  if (isVercel) {
    return '/tmp/liveData.json';
  }
  return path.join(process.cwd(), 'public', 'liveData.json');
}

const teamNameMap: Record<string, string> = {
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

function resolveWinner(apiMatch: any): string | undefined {
  const candidateNames = [apiMatch.matchWinner, apiMatch.winner, apiMatch.status]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  for (const candidate of candidateNames) {
    for (const [fullName, shortName] of Object.entries(teamNameMap)) {
      if (candidate.match(new RegExp(`\\b${fullName}\\b`, 'i'))) return shortName;
    }
  }
  return undefined;
}

// ── Fix 2: Real NRR from CricAPI score data ──────────────────────────────────
/**
 * CricAPI returns a `score` array like:
 *   [ { inning: "Team A 1st", r: 180, w: 6, o: 20 }, { inning: "Team B 1st", r: 155, w: 10, o: 18.3 } ]
 *
 * Real ICC NRR formula:
 *   NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 *
 * For a single match:
 *   winner_NRR_delta = (winner_runs / winner_overs) - (loser_runs / loser_overs)
 *   loser_NRR_delta  = (loser_runs / loser_overs) - (winner_runs / winner_overs)   [always negative]
 */
function parseOvers(oversStr: number | string): number {
  // Overs can be 18.3 meaning 18 overs and 3 balls = 18 + 3/6 = 18.5 actual overs
  const str = String(oversStr);
  const parts = str.split('.');
  const fullOvers = parseInt(parts[0], 10) || 0;
  const balls = parseInt(parts[1] || '0', 10) || 0;
  return fullOvers + balls / 6;
}

interface NRRDelta {
  winnerDelta: number;
  loserDelta: number;
}

function calculateRealNRR(apiMatch: any, winnerName: string, loserName: string): NRRDelta {
  const scores: Array<{ inning: string; r: number; w: number; o: number }> = apiMatch.score || [];

  if (!scores || scores.length < 2) {
    // Fallback to margin heuristic if no scorecard data
    return calculateHeuristicNRR(apiMatch);
  }

  // Find which inning belongs to which team
  const winnerLower = winnerName.toLowerCase();
  const loserLower = loserName.toLowerCase();

  let winnerInning: (typeof scores)[0] | undefined;
  let loserInning: (typeof scores)[0] | undefined;

  for (const inning of scores) {
    const inningName = inning.inning?.toLowerCase() || '';
    // Match against known full names
    for (const [fullName, short] of Object.entries(teamNameMap)) {
      if (inningName.includes(fullName)) {
        if (short.toLowerCase() === winnerLower || short === winnerName) {
          winnerInning = inning;
        } else if (short.toLowerCase() === loserLower || short === loserName) {
          loserInning = inning;
        }
      }
    }
  }

  // If inning-team matching fails, use positional (first inning = team batting first)
  if (!winnerInning && !loserInning && scores.length >= 2) {
    // The winner likely batted and made the higher score
    const [innings1, innings2] = scores;
    if ((innings1.r || 0) > (innings2.r || 0)) {
      winnerInning = innings1;
      loserInning = innings2;
    } else {
      winnerInning = innings2;
      loserInning = innings1;
    }
  }

  if (!winnerInning || !loserInning) {
    return calculateHeuristicNRR(apiMatch);
  }

  const winnerOvers = parseOvers(winnerInning.o || 20);
  const loserOvers = parseOvers(loserInning.o || 20);
  const winnerRR = winnerOvers > 0 ? (winnerInning.r || 0) / winnerOvers : 0;
  const loserRR = loserOvers > 0 ? (loserInning.r || 0) / loserOvers : 0;

  const delta = parseFloat((winnerRR - loserRR).toFixed(3));

  return {
    winnerDelta: Math.max(0, delta),
    loserDelta: -Math.abs(delta),
  };
}

function calculateHeuristicNRR(apiMatch: any): NRRDelta {
  // Legacy fallback: estimate from margin string
  const marginStr = String(apiMatch.status || '');
  const runsMatch = marginStr.match(/(\d+)\s*runs/i);
  const wicketsMatch = marginStr.match(/(\d+)\s*wickets/i);

  let nrrChange = 0.05;
  if (runsMatch) {
    nrrChange = Math.min(parseInt(runsMatch[1], 10) * 0.004, 0.5);
  } else if (wicketsMatch) {
    nrrChange = Math.min(parseInt(wicketsMatch[1], 10) * 0.018, 0.18);
  }
  return { winnerDelta: nrrChange, loserDelta: -nrrChange };
}

function withProbabilities(matches: any[], pointsTable: any[]) {
  return matches.map((m) => ({ ...m, probabilities: estimateWinProbability(m, pointsTable) }));
}

function buildResponse(matches: any[], pointsTable: any[], isMockData: boolean, updatedAt: number) {
  return NextResponse.json({
    matches: withProbabilities(matches, pointsTable),
    pointsTable,
    isMockData,
    updatedAt,
  });
}

/**
 * Rebuild the points table by taking the official mockData baseline and applying
 * only NEW match completions on top (matches that were pending in mockData but are
 * now completed in finalMatches via the API).
 *
 * This is the KEY function that prevents double-counting: mockData already has
 * all historical matches factored into its points table. We only increment for
 * matches whose matchNumber is GREATER than the last match already captured in
 * the mockData baseline.
 */
function rebuildPointsTable(finalMatches: any[], basePointsTable: any[]): any[] {
  const table = JSON.parse(JSON.stringify(basePointsTable));

  // The highest matchNumber that's already baked into currentPointsTable in mockData
  const BASELINE_LAST_MATCH = Math.max(
    ...([...completedMatches].map(m => m.matchNumber))
  );

  // Only process matches that are NEWER than the baseline
  const newlyCompleted = finalMatches.filter(
    (m: any) => m.status === 'completed' && m.matchNumber > BASELINE_LAST_MATCH
  );

  newlyCompleted.forEach((m: any) => {
    if (m.winner) {
      const loser = m.winner === m.team1 ? m.team2 : m.team1;
      const wEntry = table.find((t: any) => t.team === m.winner);
      const lEntry = table.find((t: any) => t.team === loser);
      if (wEntry && lEntry) {
        wEntry.matches += 1;
        wEntry.wins += 1;
        wEntry.points += 2;
        lEntry.matches += 1;
        lEntry.losses += 1;
      }
    } else {
      // No Result — both get 1 point
      const t1Entry = table.find((t: any) => t.team === m.team1);
      const t2Entry = table.find((t: any) => t.team === m.team2);
      if (t1Entry && t2Entry) {
        t1Entry.matches += 1;
        t1Entry.noResults = (t1Entry.noResults || 0) + 1;
        t1Entry.points += 1;
        t2Entry.matches += 1;
        t2Entry.noResults = (t2Entry.noResults || 0) + 1;
        t2Entry.points += 1;
      }
    }
  });

  table.sort((a: any, b: any) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });

  return table;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('forceRefresh') === '1';

  // ── ALWAYS start from the official mockData baseline ──────────────────────
  // The points table in mockData.ts is the ground truth (manually verified
  // against iplt20.com after each match day). The API only adds NEW matches
  // on top of this baseline, never older ones.
  let finalMatches = [...completedMatches, ...upcomingMatches];
  let finalPointsTable = JSON.parse(JSON.stringify(currentPointsTable));
  let lastUpdated = 0;

  // ── Server-side in-memory cache (30 min cooldown) ─────────────────────────
  const isCooldown = serverSnapshot !== null && (Date.now() - serverSnapshot.updatedAt < EXTERNAL_REFRESH_MS);
  if (isCooldown && serverSnapshot) {
    return buildResponse(
      serverSnapshot.matches,
      serverSnapshot.pointsTable,
      serverSnapshot.isMockData,
      serverSnapshot.updatedAt,
    );
  }

  // ── Check liveData.json for recent match status overrides only ───────────
  // We do NOT use the stored points table from the file — only the match
  // status updates (live/completed + winner) that the API previously fetched.
  // This prevents a stale file from propagating wrong standings.
  const liveDataPath = getLiveDataPath();
  try {
    if (fs.existsSync(liveDataPath)) {
      const localData = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'));
      const fileAge = Date.now() - Number(localData.updatedAt ?? 0);

      if (localData.matches && fileAge < EXTERNAL_REFRESH_MS) {
        // Only apply match-status overrides from the file (completed/live/winner/margin)
        // The points table is ALWAYS rebuilt from mockData — never from the file.
        (localData.matches as any[]).forEach((savedMatch: any) => {
          if (savedMatch.status === 'completed' || savedMatch.status === 'live') {
            const idx = finalMatches.findIndex(m => m.matchNumber === savedMatch.matchNumber);
            if (idx !== -1 && finalMatches[idx].status !== 'completed') {
              finalMatches[idx] = { ...finalMatches[idx], ...savedMatch };
            }
          }
        });

        lastUpdated = Number(localData.updatedAt ?? 0);

        if (fileAge < EXTERNAL_REFRESH_MS) {
          // Rebuild points table from scratch based on current finalMatches state
          const freshTable = rebuildPointsTable(finalMatches, finalPointsTable);
          serverSnapshot = {
            matches: finalMatches,
            pointsTable: freshTable,
            updatedAt: lastUpdated,
            isMockData: false,
          };
          return buildResponse(finalMatches, freshTable, false, lastUpdated);
        }
      }
    }
  } catch (err) {
    console.warn("[live-data] Could not read liveData.json:", err);
  }

  // 2. Fetch from CricAPI
  try {
    let data = null;
    let success = false;

    for (const key of API_KEYS) {
      try {
        const response = await fetch(`${BASE_URL}/currentMatches?apikey=${key}&offset=0`, {
          cache: 'no-store'
        });
        const json = await response.json();
        if (json?.status === 'success' && Array.isArray(json.data)) {
          data = json;
          success = true;
          break;
        } else {
          console.warn(`[live-data] API key ${key.slice(0, 8)}… failed. Trying next…`);
        }
      } catch (err) {
        console.error(`[live-data] Fetch failed with key ${key.slice(0, 8)}…:`, err);
      }
    }

    if (!success || !data) {
      throw new Error("All API keys failed or limits reached.");
    }

    if (data?.status === 'success' && Array.isArray(data.data)) {
      const iplMatches = data.data.filter((m: any) => {
        const t1 = teamNameMap[m.teams?.[0]?.toLowerCase()];
        const t2 = teamNameMap[m.teams?.[1]?.toLowerCase()];
        return t1 && t2;
      });

      iplMatches.forEach((apiMatch: any) => {
        const team1 = teamNameMap[apiMatch.teams?.[0]?.toLowerCase()];
        const team2 = teamNameMap[apiMatch.teams?.[1]?.toLowerCase()];

        const m =
          apiMatch.name.match(/(\d+)(?:st|nd|rd|th)?\s+Match/i) ||
          apiMatch.name.match(/Match\s+(\d+)/i) ||
          apiMatch.name.match(/Match\s*-\s*(\d+)/i);

        const matchNumber = m ? Number(m[1]) : undefined;

        let existingMatchIndex = matchNumber
          ? finalMatches.findIndex((m: any) => m.matchNumber === matchNumber)
          : -1;

        if (existingMatchIndex === -1) {
          existingMatchIndex = finalMatches.findIndex((m: any) =>
            ((m.team1 === team1 && m.team2 === team2) || (m.team1 === team2 && m.team2 === team1)) &&
            m.status !== 'completed'
          );
        }

        if (existingMatchIndex !== -1) {
          // Mark as live if match has started but not ended
          if (apiMatch.matchStarted && !apiMatch.matchEnded) {
            if (finalMatches[existingMatchIndex].status !== 'completed') {
              finalMatches[existingMatchIndex].status = 'live';
            }
          }

          if (apiMatch.matchEnded) {
            const winner = resolveWinner(apiMatch);
            const previousStatus = finalMatches[existingMatchIndex].status;

            if (winner && previousStatus !== 'completed') {
              finalMatches[existingMatchIndex].status = 'completed';
              finalMatches[existingMatchIndex].winner = winner as any;

              // Parse margin
              const marginStr = String(apiMatch.status || '');
              const runsMatch = marginStr.match(/(\d+)\s*runs/i);
              const wicketsMatch = marginStr.match(/(\d+)\s*wickets/i);
              if (runsMatch) {
                finalMatches[existingMatchIndex].margin = parseInt(runsMatch[1], 10);
                finalMatches[existingMatchIndex].marginType = 'runs';
              } else if (wicketsMatch) {
                finalMatches[existingMatchIndex].margin = parseInt(wicketsMatch[1], 10);
                finalMatches[existingMatchIndex].marginType = 'wickets';
              }

              const loser = winner === team1 ? team2 : team1;
              const wEntry = finalPointsTable.find((t: any) => t.team === winner);
              const lEntry = finalPointsTable.find((t: any) => t.team === loser);

              if (wEntry && lEntry) {
                wEntry.matches += 1;
                wEntry.wins += 1;
                wEntry.points += 2;

                lEntry.matches += 1;
                lEntry.losses += 1;

                // ── Fix 2: Use real NRR from scorecard ──
                const { winnerDelta, loserDelta } = calculateRealNRR(apiMatch, winner, loser);
                wEntry.nrr = parseFloat((wEntry.nrr + winnerDelta).toFixed(3));
                lEntry.nrr = parseFloat((lEntry.nrr + loserDelta).toFixed(3));
              }
            } else if (!winner && previousStatus !== 'completed') {
              // NO RESULT / ABANDONED — both teams get 1 point
              finalMatches[existingMatchIndex].status = 'completed';
              const wEntry = finalPointsTable.find((t: any) => t.team === team1);
              const lEntry = finalPointsTable.find((t: any) => t.team === team2);
              if (wEntry && lEntry) {
                wEntry.matches += 1;
                wEntry.noResults = (wEntry.noResults || 0) + 1;
                wEntry.points += 1;
                lEntry.matches += 1;
                lEntry.noResults = (lEntry.noResults || 0) + 1;
                lEntry.points += 1;
              }
            }
          }
        }
      });

      // ── Rebuild points table correctly from scratch ──────────────────────
      // Use rebuildPointsTable so the table is always built from the official
      // mockData baseline + only NEW match results on top. This is the primary
      // safeguard against double-counting or stale data corruption.
      finalPointsTable = rebuildPointsTable(finalMatches, JSON.parse(JSON.stringify(currentPointsTable)));

      // Recalculate qualification probabilities via Monte Carlo
      const qualResult = calculateQualificationProbabilities(finalMatches, finalPointsTable);
      finalPointsTable.forEach((t: any) => {
        const teamKey = t.team as keyof typeof qualResult.probabilities;
        t.qualificationChance = qualResult.probabilities[teamKey];
      });

      const now = Date.now();

      // Write match statuses to file for future requests (only match status, not the table)
      try {
        fs.writeFileSync(
          liveDataPath,
          JSON.stringify({ matches: finalMatches, updatedAt: now }),
        );
        lastUpdated = now;
      } catch (err) {
        console.warn("[live-data] Failed to write liveData.json:", err);
        lastUpdated = now;
      }

      serverSnapshot = {
        matches: finalMatches,
        pointsTable: finalPointsTable,
        updatedAt: lastUpdated,
        isMockData: false,
      };

      return buildResponse(finalMatches, finalPointsTable, false, lastUpdated);
    }
  } catch (error) {
    console.error("[live-data] ISR Fetch Error:", error);
  }

  // Fallback if API fails entirely
  const fallbackUpdatedAt = lastUpdated || Date.now();
  serverSnapshot = {
    matches: finalMatches,
    pointsTable: finalPointsTable,
    updatedAt: fallbackUpdatedAt,
    isMockData: true,
  };
  return buildResponse(finalMatches, finalPointsTable, true, fallbackUpdatedAt);
}
