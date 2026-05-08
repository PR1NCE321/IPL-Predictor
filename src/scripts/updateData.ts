// Run this script locally using: npx ts-node src/scripts/updateData.ts
import fs from 'fs';
import path from 'path';
import { completedMatches, upcomingMatches, currentPointsTable } from '../data/mockData';
import { calculateQualificationProbabilities } from '../services/probability';

const API_KEYS = [
  "bb55c7c3-1191-47a0-b38e-e676a4f4cdaf",
  "9cedf4d7-c377-4624-8a04-bc24a7a9cefe"
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

    let finalMatches = [...completedMatches, ...upcomingMatches];
    let finalPointsTable = JSON.parse(JSON.stringify(currentPointsTable)); // Deep copy

    const liveDataPath = path.join(process.cwd(), 'public', 'liveData.json');
    if (fs.existsSync(liveDataPath)) {
      const localData = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'));
      if (localData.matches && localData.pointsTable) {
        finalMatches = localData.matches;
        finalPointsTable = localData.pointsTable;
      }
    }

    const iplMatches = data.data.filter((m: any) => {
      const t1 = teamNameMap[m.teams?.[0]?.toLowerCase()];
      const t2 = teamNameMap[m.teams?.[1]?.toLowerCase()];
      return t1 && t2; // If both playing teams are IPL franchises, it's an IPL match!
    });

    let updatedCount = 0;

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
          // Update Match
          finalMatches[existingMatchIndex].status = 'completed';
          finalMatches[existingMatchIndex].winner = winner as any;
          updatedCount++;

          // Update Points Table
          const loser = winner === team1 ? team2 : team1;
          const wEntry = finalPointsTable.find((t: any) => t.team === winner);
          const lEntry = finalPointsTable.find((t: any) => t.team === loser);

          if (wEntry && lEntry) {
            wEntry.matches += 1;
            wEntry.wins += 1;
            wEntry.points += 2;

            lEntry.matches += 1;
            lEntry.losses += 1;
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

    const outputData = {
      matches: finalMatches,
      pointsTable: finalPointsTable,
      lastUpdated: new Date().toISOString()
    };

    const outputPath = path.join(process.cwd(), 'public', 'liveData.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

    console.log(`Successfully updated system! Found ${updatedCount} new completed matches.`);
    console.log(`Saved local database to: ${outputPath}`);

  } catch (err) {
    console.error("Failed to execute update script:", err);
  }
}

updateLiveSystem();
