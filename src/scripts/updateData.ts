// Run this script locally using: npx ts-node src/scripts/updateData.ts
// Requires .env.local to have CRICAPI_KEY_1, CRICAPI_KEY_2, CRICAPI_KEY_3
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { completedMatches, upcomingMatches, currentPointsTable } from '../data/mockData';
import { calculateQualificationProbabilities } from '../services/probability';

const API_KEYS = [
  process.env.CRICAPI_KEY_1,
  process.env.CRICAPI_KEY_2,
  process.env.CRICAPI_KEY_3,
].filter(Boolean) as string[];

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

function parseOvers(oversStr: number | string): number {
  const str = String(oversStr);
  const parts = str.split('.');
  const fullOvers = parseInt(parts[0], 10) || 0;
  const balls = parseInt(parts[1] || '0', 10) || 0;
  return fullOvers + balls / 6;
}

interface NRRData {
  winnerDelta: number;
  loserDelta: number;
  winnerRuns?: number;
  winnerOvers?: number;
  loserRuns?: number;
  loserOvers?: number;
}

function calculateHeuristicNRR(apiMatch: any): NRRData {
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

function calculateRealNRR(apiMatch: any, winnerName: string, loserName: string): NRRData {
  const scores: Array<{ inning: string; r: number; w: number; o: number }> = apiMatch.score || [];

  if (!scores || scores.length < 2) {
    return calculateHeuristicNRR(apiMatch);
  }

  const winnerLower = winnerName.toLowerCase();
  const loserLower = loserName.toLowerCase();

  let winnerInning: (typeof scores)[0] | undefined;
  let loserInning: (typeof scores)[0] | undefined;

  for (const inning of scores) {
    const inningName = inning.inning?.toLowerCase() || '';
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

  if (!winnerInning && !loserInning && scores.length >= 2) {
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
    winnerRuns: winnerInning.r || 0,
    winnerOvers: parseFloat(String(winnerInning.o || 20)),
    loserRuns: loserInning.r || 0,
    loserOvers: parseFloat(String(loserInning.o || 20)),
  };
}

function getMatchNRRDelta(m: any): NRRData {
  if (m.nrrDelta) {
    return m.nrrDelta;
  }
  let nrrChange = 0.05;
  if (m.marginType === 'runs' && typeof m.margin === 'number') {
    nrrChange = Math.min(m.margin * 0.004, 0.5);
  } else if (m.marginType === 'wickets' && typeof m.margin === 'number') {
    nrrChange = Math.min(m.margin * 0.018, 0.18);
  }
  const winnerDelta = parseFloat(nrrChange.toFixed(3));
  return { winnerDelta, loserDelta: -winnerDelta };
}

function addOvers(o1: number, o2: number): number {
  const o1Str = String(o1).split('.');
  const o2Str = String(o2).split('.');
  const overs1 = parseInt(o1Str[0], 10) || 0;
  const balls1 = parseInt(o1Str[1] || '0', 10) || 0;
  const overs2 = parseInt(o2Str[0], 10) || 0;
  const balls2 = parseInt(o2Str[1] || '0', 10) || 0;
  
  let totalBalls = balls1 + balls2;
  let extraOvers = Math.floor(totalBalls / 6);
  totalBalls = totalBalls % 6;
  
  return (overs1 + overs2 + extraOvers) + (totalBalls / 10);
}

// The highest matchNumber already baked into currentPointsTable
const BASELINE_LAST_MATCH = Math.max(...([...completedMatches].map(m => m.matchNumber)));

async function updateLiveSystem() {
  console.log("Fetching latest IPL data from CricAPI...");

  try {
    let data = null;
    let success = false;

    for (const key of API_KEYS) {
      try {
        const response = await fetch(`${BASE_URL}/currentMatches?apikey=${key}&offset=0`);
        const json = await response.json();

        if (json?.status === 'success' && Array.isArray(json.data)) {
          data = json;
          success = true;
          break;
        } else {
          console.warn(`API key ${key?.slice(0, 8)}… failed or limit reached. Trying next...`);
        }
      } catch (err) {
        console.error(`Fetch failed with key ${key?.slice(0, 8)}…:`, err);
      }
    }

    if (!success || !data) {
      throw new Error("All API keys failed or limits reached.");
    }

    // Start from the official mockData baseline
    let finalMatches = [...completedMatches, ...upcomingMatches];
    const finalPointsTable = JSON.parse(JSON.stringify(currentPointsTable));

    // Apply any status overrides from existing liveData.json (match statuses only)
    const liveDataPath = path.join(process.cwd(), 'public', 'liveData.json');
    if (fs.existsSync(liveDataPath)) {
      try {
        const localData = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'));
        if (localData.matches) {
          (localData.matches as any[]).forEach((savedMatch: any) => {
            if (savedMatch.status === 'completed' || savedMatch.status === 'live') {
              const idx = finalMatches.findIndex(m => m.matchNumber === savedMatch.matchNumber);
              if (idx !== -1 && finalMatches[idx].status !== 'completed') {
                finalMatches[idx] = { ...finalMatches[idx], ...savedMatch };
              }
            }
          });
        }
      } catch { /* ignore bad file */ }
    }

    const iplMatches = data.data.filter((m: any) => {
      const t1 = teamNameMap[m.teams?.[0]?.toLowerCase()];
      const t2 = teamNameMap[m.teams?.[1]?.toLowerCase()];
      return t1 && t2;
    });

    let updatedCount = 0;

    iplMatches.forEach((apiMatch: any) => {
      const team1 = teamNameMap[apiMatch.teams?.[0]?.toLowerCase()];
      const team2 = teamNameMap[apiMatch.teams?.[1]?.toLowerCase()];

      const matchRegex =
        apiMatch.name.match(/(\d+)(?:st|nd|rd|th)?\s+Match/i) ||
        apiMatch.name.match(/Match\s+(\d+)/i) ||
        apiMatch.name.match(/Match\s*-\s*(\d+)/i);
      const matchNumber = matchRegex ? Number(matchRegex[1]) : undefined;

      let existingMatchIndex = matchNumber
        ? finalMatches.findIndex(m => m.matchNumber === matchNumber)
        : -1;

      if (existingMatchIndex === -1) {
        existingMatchIndex = finalMatches.findIndex(m =>
          ((m.team1 === team1 && m.team2 === team2) || (m.team1 === team2 && m.team2 === team1)) &&
          m.status !== 'completed'
        );
      }

      if (existingMatchIndex !== -1 && apiMatch.matchEnded) {
        const winner = resolveWinner(apiMatch);
        const previousStatus = finalMatches[existingMatchIndex].status;

        if (winner && (previousStatus !== 'completed' || !finalMatches[existingMatchIndex].nrrDelta)) {
          finalMatches[existingMatchIndex].status = 'completed';
          finalMatches[existingMatchIndex].winner = winner as any;
          if (previousStatus !== 'completed') updatedCount++;

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
          const { winnerDelta, loserDelta, winnerRuns, winnerOvers, loserRuns, loserOvers } = calculateRealNRR(apiMatch, winner, loser);
          finalMatches[existingMatchIndex].nrrDelta = { winnerDelta, loserDelta, winnerRuns, winnerOvers, loserRuns, loserOvers };
        } else if (!winner && previousStatus !== 'completed') {
          finalMatches[existingMatchIndex].status = 'completed';
          updatedCount++;
        }
      }
    });

    // Rebuild points table correctly (only new matches beyond the baseline)
    const builtTable = JSON.parse(JSON.stringify(finalPointsTable));
    const newlyCompleted = finalMatches.filter(
      (m: any) => m.status === 'completed' && m.matchNumber > BASELINE_LAST_MATCH
    );

    newlyCompleted.forEach((m: any) => {
      if (m.winner) {
        const loser = m.winner === m.team1 ? m.team2 : m.team1;
        const wEntry = builtTable.find((t: any) => t.team === m.winner);
        const lEntry = builtTable.find((t: any) => t.team === loser);
        if (wEntry && lEntry) {
          wEntry.matches += 1; wEntry.wins += 1; wEntry.points += 2;
          lEntry.matches += 1; lEntry.losses += 1;

          const deltas = getMatchNRRDelta(m);
          
          if (deltas.winnerRuns !== undefined && deltas.winnerOvers !== undefined && 
              wEntry.runsFor !== undefined && wEntry.oversFor !== undefined) {
             wEntry.runsFor += deltas.winnerRuns;
             wEntry.oversFor = addOvers(wEntry.oversFor, deltas.winnerOvers);
             wEntry.runsAgainst += deltas.loserRuns;
             wEntry.oversAgainst = addOvers(wEntry.oversAgainst, deltas.loserOvers);
             
             lEntry.runsFor += deltas.loserRuns;
             lEntry.oversFor = addOvers(lEntry.oversFor, deltas.loserOvers);
             lEntry.runsAgainst += deltas.winnerRuns;
             lEntry.oversAgainst = addOvers(lEntry.oversAgainst, deltas.winnerOvers);

             const wRRFor = parseOvers(wEntry.oversFor) > 0 ? (wEntry.runsFor / parseOvers(wEntry.oversFor)) : 0;
             const wRRAgainst = parseOvers(wEntry.oversAgainst) > 0 ? (wEntry.runsAgainst / parseOvers(wEntry.oversAgainst)) : 0;
             wEntry.nrr = parseFloat((wRRFor - wRRAgainst).toFixed(3));
             
             const lRRFor = parseOvers(lEntry.oversFor) > 0 ? (lEntry.runsFor / parseOvers(lEntry.oversFor)) : 0;
             const lRRAgainst = parseOvers(lEntry.oversAgainst) > 0 ? (lEntry.runsAgainst / parseOvers(lEntry.oversAgainst)) : 0;
             lEntry.nrr = parseFloat((lRRFor - lRRAgainst).toFixed(3));
          } else {
             wEntry.nrr = parseFloat((wEntry.nrr + deltas.winnerDelta).toFixed(3));
             lEntry.nrr = parseFloat((lEntry.nrr + deltas.loserDelta).toFixed(3));
          }
        }
      } else {
        const t1 = builtTable.find((t: any) => t.team === m.team1);
        const t2 = builtTable.find((t: any) => t.team === m.team2);
        if (t1 && t2) {
          t1.matches += 1; t1.noResults = (t1.noResults || 0) + 1; t1.points += 1;
          t2.matches += 1; t2.noResults = (t2.noResults || 0) + 1; t2.points += 1;
        }
      }
    });

    builtTable.sort((a: any, b: any) =>
      b.points !== a.points ? b.points - a.points : b.nrr - a.nrr
    );

    const qualResult = calculateQualificationProbabilities(finalMatches, builtTable);
    builtTable.forEach((t: any) => {
      const teamKey = t.team as keyof typeof qualResult.probabilities;
      t.qualificationChance = qualResult.probabilities[teamKey];
    });

    // Save only match statuses (not the table — table is always rebuilt from mockData)
    const outputPath = path.join(process.cwd(), 'public', 'liveData.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      matches: finalMatches,
      updatedAt: Date.now()
    }, null, 2));

    console.log(`✅ Updated! ${updatedCount} new matches completed.`);
    console.log(`📍 Saved to: ${outputPath}`);
    console.log('\nCurrent points table:');
    builtTable.forEach((t: any, i: number) =>
      console.log(`  ${i + 1}. ${t.team.padEnd(5)} ${t.points}pts  NRR:${t.nrr.toFixed(3)}  Q:${t.qualificationChance}%`)
    );

  } catch (err) {
    console.error("Failed to execute update script:", err);
  }
}

updateLiveSystem();
