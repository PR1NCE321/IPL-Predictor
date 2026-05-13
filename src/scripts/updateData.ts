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

        if (winner && previousStatus !== 'completed') {
          finalMatches[existingMatchIndex].status = 'completed';
          finalMatches[existingMatchIndex].winner = winner as any;
          updatedCount++;

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
