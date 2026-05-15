import fs from 'fs';
import path from 'path';
import readline from 'readline';

const csvFilePath = path.join(process.cwd(), 'IPL.csv');
const outputFilePath = path.join(process.cwd(), 'src', 'data', 'historicalH2H.json');

const teamNameMapping: Record<string, string> = {
  'Delhi Daredevils': 'DC',
  'Delhi Capitals': 'DC',
  'Kings XI Punjab': 'PBKS',
  'Punjab Kings': 'PBKS',
  'Royal Challengers Bangalore': 'RCB',
  'Royal Challengers Bengaluru': 'RCB',
  'Deccan Chargers': 'SRH',
  'Sunrisers Hyderabad': 'SRH',
  'Chennai Super Kings': 'CSK',
  'Mumbai Indians': 'MI',
  'Kolkata Knight Riders': 'KKR',
  'Rajasthan Royals': 'RR',
  'Gujarat Titans': 'GT',
  'Lucknow Super Giants': 'LSG',
  'Rising Pune Supergiant': 'RPS',
  'Rising Pune Supergiants': 'RPS',
  'Pune Warriors': 'PWI',
  'Gujarat Lions': 'GL',
  'Kochi Tuskers Kerala': 'KTK',
};

function normalizeTeam(name: string) {
  return teamNameMapping[name] || name;
}

async function processData() {
  if (!fs.existsSync(csvFilePath)) {
    console.error('IPL.csv not found at', csvFilePath);
    return;
  }

  const fileStream = fs.createReadStream(csvFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isFirstLine = true;
  let headers: string[] = [];

  let matchIdIdx = -1;
  let batTeamIdx = -1;
  let bowlTeamIdx = -1;
  let runsTotalIdx = -1;
  let matchWonByIdx = -1;

  // MatchID -> { team1, team2, winner, team1Runs, team2Runs }
  const matchData: Record<string, { team1: string, team2: string, winner: string, runs: Record<string, number> }> = {};

  console.log('Processing IPL.csv...');

  function parseCSVRow(line: string) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for(let i=0; i<line.length; i++) {
      const char = line[i];
      if(char === '"') inQuotes = !inQuotes;
      else if(char === ',' && !inQuotes) {
        result.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, '').trim());
    return result;
  }

  for await (const line of rl) {
    if (isFirstLine) {
      headers = parseCSVRow(line);
      matchIdIdx = headers.indexOf('match_id');
      batTeamIdx = headers.indexOf('batting_team');
      bowlTeamIdx = headers.indexOf('bowling_team');
      runsTotalIdx = headers.indexOf('runs_total');
      matchWonByIdx = headers.indexOf('match_won_by');
      isFirstLine = false;
      continue;
    }

    const cleanRow = parseCSVRow(line);
    
    if (matchIdIdx === -1 || batTeamIdx === -1) break;

    const matchId = cleanRow[matchIdIdx];
    const batTeamRaw = cleanRow[batTeamIdx];
    const bowlTeamRaw = cleanRow[bowlTeamIdx];
    const runsTotal = parseInt(cleanRow[runsTotalIdx] || '0', 10);
    const winnerRaw = cleanRow[matchWonByIdx];

    if (!matchId || !batTeamRaw || !bowlTeamRaw) continue;

    const batTeam = normalizeTeam(batTeamRaw);
    const bowlTeam = normalizeTeam(bowlTeamRaw);
    const winner = normalizeTeam(winnerRaw);

    if (!matchData[matchId]) {
      matchData[matchId] = {
        team1: batTeam,
        team2: bowlTeam,
        winner: winner,
        runs: {}
      };
    }

    if (!matchData[matchId].runs[batTeam]) matchData[matchId].runs[batTeam] = 0;
    matchData[matchId].runs[batTeam] += runsTotal;
  }

  console.log(`Processed ${Object.keys(matchData).length} unique matches.`);

  // Now aggregate into H2H format
  const h2hStats: Record<string, any> = {};

  for (const matchId in matchData) {
    const match = matchData[matchId];
    const t1 = match.team1;
    const t2 = match.team2;
    if (t1 === t2) continue; // safety

    const sortedTeams = [t1, t2].sort();
    const key = `${sortedTeams[0]}-${sortedTeams[1]}`;

    if (!h2hStats[key]) {
      h2hStats[key] = {
        team1: sortedTeams[0],
        team2: sortedTeams[1],
        matches: 0,
        team1Wins: 0,
        team2Wins: 0,
        highestScore1: 0,
        highestScore2: 0,
        lowestScore1: 999,
        lowestScore2: 999
      };
    }

    const stats = h2hStats[key];
    stats.matches++;

    if (match.winner === stats.team1) stats.team1Wins++;
    if (match.winner === stats.team2) stats.team2Wins++;

    const t1Runs = match.runs[stats.team1] || 0;
    const t2Runs = match.runs[stats.team2] || 0;

    if (t1Runs > 0) {
      if (t1Runs > stats.highestScore1) stats.highestScore1 = t1Runs;
      if (t1Runs < stats.lowestScore1) stats.lowestScore1 = t1Runs;
    }
    
    if (t2Runs > 0) {
      if (t2Runs > stats.highestScore2) stats.highestScore2 = t2Runs;
      if (t2Runs < stats.lowestScore2) stats.lowestScore2 = t2Runs;
    }
  }

  // Cleanup lowest scores if 999
  for (const key in h2hStats) {
    if (h2hStats[key].lowestScore1 === 999) h2hStats[key].lowestScore1 = 0;
    if (h2hStats[key].lowestScore2 === 999) h2hStats[key].lowestScore2 = 0;
  }

  fs.writeFileSync(outputFilePath, JSON.stringify(h2hStats, null, 2));
  console.log(`Saved H2H aggregated data to ${outputFilePath}`);
}

processData().catch(console.error);
