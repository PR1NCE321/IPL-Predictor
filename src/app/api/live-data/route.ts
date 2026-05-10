import { NextResponse } from 'next/server';
import { completedMatches, upcomingMatches, currentPointsTable } from '@/data/mockData';
import { estimateWinProbability, calculateQualificationProbabilities } from '@/services/probability';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const EXTERNAL_REFRESH_MS = 25 * 60 * 1000; // 25 minutes

let serverSnapshot:
  | {
      matches: any[];
      pointsTable: any[];
      updatedAt: number;
      isMockData: boolean;
    }
  | null = null;

const API_KEYS = [
  "9cedf4d7-c377-4624-8a04-bc24a7a9cefe",
  "bb55c7c3-1191-47a0-b38e-e676a4f4cdaf"

];
const BASE_URL = "https://api.cricapi.com/v1";

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

function resolveWinner(apiMatch: any) {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('forceRefresh') === '1';
  let finalMatches = [...completedMatches, ...upcomingMatches];
  let finalPointsTable = JSON.parse(JSON.stringify(currentPointsTable));
  let lastUpdated = 0;

  // Treat forceRefresh from client as "bypass client cache", but server still enforces EXTERNAL_REFRESH_MS cooldown
  // to prevent spamming CricAPI on every window focus.
  const isCooldown = serverSnapshot && (Date.now() - serverSnapshot.updatedAt < EXTERNAL_REFRESH_MS);
  
  if (isCooldown) {
    return buildResponse(
      serverSnapshot.matches,
      serverSnapshot.pointsTable,
      serverSnapshot.isMockData,
      serverSnapshot.updatedAt,
    );
  }

  // 1. Try to read from local file first to ensure continuity
  try {
    const liveDataPath = path.join(process.cwd(), 'public', 'liveData.json');
    if (fs.existsSync(liveDataPath)) {
      const localData = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'));
      if (localData.matches && localData.pointsTable) {
        finalMatches = localData.matches;
        finalPointsTable = localData.pointsTable;
        lastUpdated = Number(localData.updatedAt ?? 0);

        if (lastUpdated > 0 && Date.now() - lastUpdated < EXTERNAL_REFRESH_MS) {
          serverSnapshot = {
            matches: finalMatches,
            pointsTable: finalPointsTable,
            updatedAt: lastUpdated,
            isMockData: false,
          };

          return buildResponse(finalMatches, finalPointsTable, false, lastUpdated);
        }
      }
    }
  } catch (err) {
    console.warn("Could not read local liveData.json", err);
  }

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
          break; // Key worked, no need to try the next one
        } else {
          console.warn(`API key ${key} failed or limit reached. Trying next...`);
        }
      } catch (err) {
        console.error(`Fetch failed with key ${key}:`, err);
      }
    }

    if (!success || !data) {
      throw new Error("All API keys failed or limits reached.");
    }

    if (data?.status === 'success' && Array.isArray(data.data)) {
      const iplMatches = data.data.filter((m: any) => {
        const t1 = teamNameMap[m.teams?.[0]?.toLowerCase()];
        const t2 = teamNameMap[m.teams?.[1]?.toLowerCase()];
        return t1 && t2; // If both playing teams are IPL franchises, it's an IPL match!
      });

      iplMatches.forEach((apiMatch: any) => {
        const team1 = teamNameMap[apiMatch.teams?.[0]?.toLowerCase()];
        const team2 = teamNameMap[apiMatch.teams?.[1]?.toLowerCase()];

        const matchNumberMatch = apiMatch.name.match(/(\d+)(?:st|nd|rd|th)?\s+Match/i);
        const matchNumber = matchNumberMatch ? Number(matchNumberMatch[1]) : undefined;

        const existingMatchIndex = matchNumber
          ? finalMatches.findIndex(m => m.matchNumber === matchNumber)
          : finalMatches.findIndex(m =>
            (m.team1 === team1 && m.team2 === team2) ||
            (m.team1 === team2 && m.team2 === team1)
          );

        if (existingMatchIndex !== -1 && apiMatch.matchEnded) {
          const winner = resolveWinner(apiMatch);
          const previousStatus = finalMatches[existingMatchIndex].status;

          if (winner && previousStatus !== 'completed') {
            finalMatches[existingMatchIndex].status = 'completed';
            finalMatches[existingMatchIndex].winner = winner as any;

            // Extract margin and marginType from status string
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

              // Simple dynamic NRR heuristic based on win margin
              let nrrChange = 0.05;
              const marginStr = String(apiMatch.status || '');
              const runsMatch = marginStr.match(/(\d+)\s*runs/i);
              const wicketsMatch = marginStr.match(/(\d+)\s*wickets/i);

              if (runsMatch) {
                const runs = parseInt(runsMatch[1], 10);
                nrrChange = runs * 0.005;
              } else if (wicketsMatch) {
                const wickets = parseInt(wicketsMatch[1], 10);
                nrrChange = wickets * 0.02;
              }

              wEntry.nrr = parseFloat((wEntry.nrr + nrrChange).toFixed(3));
              lEntry.nrr = parseFloat((lEntry.nrr - nrrChange).toFixed(3));
            }
          }
        }
      });

      finalPointsTable.sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.nrr - a.nrr;
      });

      // Recalculate true qualification probabilities via Monte Carlo simulation
      const qualResult = calculateQualificationProbabilities(finalMatches, finalPointsTable);
      finalPointsTable.forEach((t: any) => {
        const teamKey = t.team as keyof typeof qualResult.probabilities;
        t.qualificationChance = qualResult.probabilities[teamKey];
      });

      // Write the updated data back to liveData.json so it persists!
      try {
        const liveDataPath = path.join(process.cwd(), 'public', 'liveData.json');
        const now = Date.now();
        fs.writeFileSync(
          liveDataPath,
          JSON.stringify({ matches: finalMatches, pointsTable: finalPointsTable, updatedAt: now }),
        );
        lastUpdated = now;
      } catch (err) {
        console.warn("Failed to write to liveData.json", err);
      }

      if (!lastUpdated) {
        lastUpdated = Date.now();
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
    console.error("ISR Fetch Error:", error);
  }

  // Fallback if API fails
  const fallbackUpdatedAt = lastUpdated || Date.now();
  serverSnapshot = {
    matches: finalMatches,
    pointsTable: finalPointsTable,
    updatedAt: fallbackUpdatedAt,
    isMockData: true,
  };

  return buildResponse(finalMatches, finalPointsTable, true, fallbackUpdatedAt);
}
