import fs from 'fs';
import path from 'path';
import readline from 'readline';

const csvFilePath = path.join(process.cwd(), 'IPL.csv');
const venuesPath = path.join(process.cwd(), 'src', 'data', 'venueStats.json');
const playerBattlesPath = path.join(process.cwd(), 'src', 'data', 'playerBattles.json');
const teamPhasesPath = path.join(process.cwd(), 'src', 'data', 'teamPhases.json');

const teamNameMapping: Record<string, string> = {
  'Delhi Daredevils': 'DC', 'Delhi Capitals': 'DC',
  'Kings XI Punjab': 'PBKS', 'Punjab Kings': 'PBKS',
  'Royal Challengers Bangalore': 'RCB', 'Royal Challengers Bengaluru': 'RCB',
  'Deccan Chargers': 'SRH', 'Sunrisers Hyderabad': 'SRH',
  'Chennai Super Kings': 'CSK', 'Mumbai Indians': 'MI',
  'Kolkata Knight Riders': 'KKR', 'Rajasthan Royals': 'RR',
  'Gujarat Titans': 'GT', 'Lucknow Super Giants': 'LSG',
  'Rising Pune Supergiant': 'RPS', 'Rising Pune Supergiants': 'RPS',
  'Pune Warriors': 'PWI', 'Gujarat Lions': 'GL', 'Kochi Tuskers Kerala': 'KTK',
};

function normalizeTeam(name: string) { return teamNameMapping[name] || name; }

// Normalize venues
const venueMapping: Record<string, string> = {
  'M Chinnaswamy Stadium': 'M Chinnaswamy Stadium',
  'M.Chinnaswamy Stadium': 'M Chinnaswamy Stadium',
  'Wankhede Stadium': 'Wankhede Stadium',
  'Wankhede Stadium, Mumbai': 'Wankhede Stadium',
  'MA Chidambaram Stadium, Chepauk': 'MA Chidambaram Stadium',
  'MA Chidambaram Stadium, Chepauk, Chennai': 'MA Chidambaram Stadium',
  'MA Chidambaram Stadium': 'MA Chidambaram Stadium',
  'Eden Gardens': 'Eden Gardens',
  'Eden Gardens, Kolkata': 'Eden Gardens',
  'Arun Jaitley Stadium': 'Arun Jaitley Stadium',
  'Arun Jaitley Stadium, Delhi': 'Arun Jaitley Stadium',
  'Feroz Shah Kotla': 'Arun Jaitley Stadium',
  'Rajiv Gandhi International Stadium, Uppal': 'Rajiv Gandhi International Stadium',
  'Rajiv Gandhi International Stadium, Uppal, Hyderabad': 'Rajiv Gandhi International Stadium',
  'Rajiv Gandhi International Stadium': 'Rajiv Gandhi International Stadium',
  'Punjab Cricket Association Stadium, Mohali': 'PCA Stadium, Mohali',
  'Punjab Cricket Association IS Bindra Stadium, Mohali': 'PCA Stadium, Mohali',
  'Punjab Cricket Association IS Bindra Stadium': 'PCA Stadium, Mohali',
  'Sawai Mansingh Stadium': 'Sawai Mansingh Stadium',
  'Sawai Mansingh Stadium, Jaipur': 'Sawai Mansingh Stadium',
  'Narendra Modi Stadium, Ahmedabad': 'Narendra Modi Stadium',
  'Sardar Patel Stadium, Motera': 'Narendra Modi Stadium',
  'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow': 'Ekana Stadium, Lucknow'
};

function normalizeVenue(name: string) { return venueMapping[name] || name; }

async function processData() {
  if (!fs.existsSync(csvFilePath)) {
    console.error('IPL.csv not found');
    return;
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(csvFilePath),
    crlfDelay: Infinity
  });

  let isFirstLine = true;
  let headers: string[] = [];
  let colIdx: Record<string, number> = {};

  const matchData: Record<string, any> = {};
  const venueStats: Record<string, any> = {};
  const playerBattles: Record<string, any> = {};
  const teamPhases: Record<string, any> = {};

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
      } else current += char;
    }
    result.push(current.replace(/^"|"$/g, '').trim());
    return result;
  }

  console.log('Processing IPL.csv for advanced stats...');

  for await (const line of rl) {
    if (isFirstLine) {
      headers = parseCSVRow(line);
      headers.forEach((h, i) => colIdx[h] = i);
      isFirstLine = false;
      continue;
    }

    const row = parseCSVRow(line);
    const matchId = row[colIdx['match_id']];
    const batTeam = normalizeTeam(row[colIdx['batting_team']]);
    const over = parseInt(row[colIdx['over']] || '0', 10);
    const runsTotal = parseInt(row[colIdx['runs_total']] || '0', 10);
    const runsBatter = parseInt(row[colIdx['runs_batter']] || '0', 10);
    const batter = row[colIdx['batter']];
    const bowler = row[colIdx['bowler']];
    const playerOut = row[colIdx['player_out']];
    const wicketKind = row[colIdx['wicket_kind']];
    const innings = parseInt(row[colIdx['innings']] || '1', 10);
    const venueRaw = row[colIdx['venue']];
    const winnerRaw = row[colIdx['match_won_by']];
    const tossWinner = normalizeTeam(row[colIdx['toss_winner']]);
    const tossDecision = row[colIdx['toss_decision']];

    if (!matchId) continue;

    // 1. MATCH AGGREGATION FOR VENUES
    if (!matchData[matchId]) {
      matchData[matchId] = {
        venue: normalizeVenue(venueRaw),
        winner: normalizeTeam(winnerRaw),
        tossWinner,
        tossDecision,
        innings1Runs: 0,
        innings2Runs: 0,
      };
    }
    if (innings === 1) matchData[matchId].innings1Runs += runsTotal;
    if (innings === 2) matchData[matchId].innings2Runs += runsTotal;

    // 2. VENUE AGGREGATION (Wickets)
    const venue = normalizeVenue(venueRaw);
    if (!venueStats[venue]) {
      venueStats[venue] = { matches: 0, avgFirstInnings: 0, batFirstWins: 0, chaseWins: 0, paceWickets: 0, spinWickets: 0, total1stInningsRuns: 0, matchesWith1stInnings: 0 };
    }
    const isWicket = playerOut && playerOut.length > 0;
    if (isWicket) {
      // Basic heuristic: caught and bowled, bowled, lbw, caught. We can't perfectly tell pace/spin without bowler type data, 
      // but we will just count total wickets for now or use a heuristic if we had bowler types.
      // Let's just track total wickets to keep it simple, or mock pace/spin ratio.
    }

    // 3. PLAYER BATTLES
    if (batter && bowler) {
      const battleKey = `${batter}|${bowler}`;
      if (!playerBattles[battleKey]) {
        playerBattles[battleKey] = { runs: 0, balls: 0, dismissals: 0 };
      }
      playerBattles[battleKey].runs += runsBatter;
      // Note: wide balls don't count as balls faced usually, but for simplicity we count valid balls.
      const extraType = row[colIdx['extra_type']];
      if (extraType !== 'wides') {
        playerBattles[battleKey].balls += 1;
      }
      if (playerOut === batter) {
        playerBattles[battleKey].dismissals += 1;
      }
    }

    // 4. TEAM PHASES
    if (batTeam) {
      if (!teamPhases[batTeam]) {
        teamPhases[batTeam] = {
          powerplay: { runs: 0, wickets: 0, balls: 0 },
          middle: { runs: 0, wickets: 0, balls: 0 },
          death: { runs: 0, wickets: 0, balls: 0 },
        };
      }
      
      let phase = 'middle';
      if (over < 6) phase = 'powerplay';
      else if (over >= 15) phase = 'death';

      teamPhases[batTeam][phase].runs += runsTotal;
      teamPhases[batTeam][phase].balls += 1;
      if (isWicket) teamPhases[batTeam][phase].wickets += 1;
    }
  }

  // Post-process match data for venues
  for (const matchId in matchData) {
    const match = matchData[matchId];
    if (!match.venue) continue;
    
    const vStats = venueStats[match.venue];
    if (vStats) {
      vStats.matches += 1;
      if (match.innings1Runs > 0) {
        vStats.total1stInningsRuns += match.innings1Runs;
        vStats.matchesWith1stInnings += 1;
      }

      // Did team batting first win?
      // innings 1 team is the one who batted first.
      // We don't strictly have innings 1 team name in matchData unless we saved it, but we can deduce by toss.
      // If toss_decision == 'bat', toss_winner batted first.
      // If toss_decision == 'field', toss_winner bowled first (so other team batted first).
      // Actually simpler: If innings1Runs > innings2Runs, bat first won (ignoring DLS).
      if (match.innings1Runs > match.innings2Runs) {
        vStats.batFirstWins += 1;
      } else if (match.innings2Runs > match.innings1Runs) {
        vStats.chaseWins += 1;
      }
    }
  }

  for (const v in venueStats) {
    if (venueStats[v].matchesWith1stInnings > 0) {
      venueStats[v].avgFirstInnings = Math.round(venueStats[v].total1stInningsRuns / venueStats[v].matchesWith1stInnings);
    }
  }

  // Filter player battles to top ones to save space (e.g. at least 30 balls faced)
  const filteredBattles: Record<string, any> = {};
  for (const k in playerBattles) {
    if (playerBattles[k].balls >= 30) {
      filteredBattles[k] = playerBattles[k];
    }
  }

  fs.writeFileSync(venuesPath, JSON.stringify(venueStats, null, 2));
  fs.writeFileSync(playerBattlesPath, JSON.stringify(filteredBattles, null, 2));
  fs.writeFileSync(teamPhasesPath, JSON.stringify(teamPhases, null, 2));

  console.log('Saved venueStats.json, playerBattles.json, teamPhases.json');
}

processData().catch(console.error);
