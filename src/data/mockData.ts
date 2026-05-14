import { Match, PointsTableEntry, ProbabilityEntry, Team, TeamInfo } from '@/types';

// IPL 2026 Teams Information
export const teamInfo: Record<Team, TeamInfo> = {
  CSK: {
    id: 'csk', name: 'Chennai Super Kings', shortName: 'CSK', color: '#F9CD05',
    logo: '/logos/CSKoutline.avif', fallbackLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/1200px-Chennai_Super_Kings_Logo.svg.png',
    description: '5-time IPL Champions. Led by Ruturaj Gaikwad.',
    captain: { name: 'Ruturaj Gaikwad', image: '/captains/CSKcaptain.avif', fallbackImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Ruturaj_Gaikwad_in_PMO_New_Delhi.jpg/800px-Ruturaj_Gaikwad_in_PMO_New_Delhi.jpg' }
  },
  MI: {
    id: 'mi', name: 'Mumbai Indians', shortName: 'MI', color: '#004BA0',
    logo: '/logos/MIoutline.avif', fallbackLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/1200px-Mumbai_Indians_Logo.svg.png',
    description: '5-time IPL Champions. Led by Hardik Pandya.',
    captain: { name: 'Hardik Pandya', image: '/captains/MIcaptain.avif', fallbackImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Hardik_Pandya_in_PMO_New_Delhi.jpg/800px-Hardik_Pandya_in_PMO_New_Delhi.jpg' }
  },
  RCB: {
    id: 'rcb', name: 'Royal Challengers Bengaluru', shortName: 'RCB', color: '#D11D27',
    logo: '/logos/RCBoutline.avif', fallbackLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Royal_Challengers_Bengaluru_logo.png/1200px-Royal_Challengers_Bengaluru_logo.png',
    description: 'Defending champions 2025. Led by Rajat Patidar.',
    captain: { name: 'Rajat Patidar', image: '/captains/RCBcaptain.avif', fallbackImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Virat_Kohli.jpg/800px-Virat_Kohli.jpg' }
  },
  KKR: {
    id: 'kkr', name: 'Kolkata Knight Riders', shortName: 'KKR', color: '#5C287F',
    logo: '/logos/KKRoutline.avif', fallbackLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/1200px-Kolkata_Knight_Riders_Logo.svg.png',
    description: '3-time Champions led by Ajinkya Rahane.',
    captain: { name: 'Ajinkya Rahane', image: '/captains/KKRcaptain.avif', fallbackImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Shreyas_Iyer_in_PMO_New_Delhi.jpg/800px-Shreyas_Iyer_in_PMO_New_Delhi.jpg' }
  },
  GT: {
    id: 'gt', name: 'Gujarat Titans', shortName: 'GT', color: '#B57EDC',
    logo: '/logos/GToutline.avif', fallbackLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/1200px-Gujarat_Titans_Logo.svg.png',
    description: 'Champions of 2022. Led by Shubman Gill.',
    captain: { name: 'Shubman Gill', image: '/captains/GTcaptain.avif', fallbackImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Shubman_Gill_in_PMO_New_Delhi.jpg/800px-Shubman_Gill_in_PMO_New_Delhi.jpg' }
  },
  DC: {
    id: 'dc', name: 'Delhi Capitals', shortName: 'DC', color: '#17409B',
    logo: '/logos/DCoutline.avif', fallbackLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Delhi_Capitals_Logo.svg/1200px-Delhi_Capitals_Logo.svg.png',
    description: 'Led by Axar Patel with a strong squad.',
    captain: { name: 'Axar Patel', image: '/captains/DCcaptain.avif', fallbackImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Rishabh_Pant_in_PMO_New_Delhi.jpg/800px-Rishabh_Pant_in_PMO_New_Delhi.jpg' }
  },
  PBKS: {
    id: 'pbks', name: 'Punjab Kings', shortName: 'PBKS', color: '#D71920',
    logo: '/logos/PBKSoutline.avif', fallbackLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/1200px-Punjab_Kings_Logo.svg.png',
    description: 'Led by Shreyas Iyer.',
    captain: { name: 'Shreyas Iyer', image: '/captains/PBKScaptain.avif', fallbackImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Sam_Curran.jpg/800px-Sam_Curran.jpg' }
  },
  LSG: {
    id: 'lsg', name: 'Lucknow Super Giants', shortName: 'LSG', color: '#A72056',
    logo: '/logos/LSGoutline.avif', fallbackLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Lucknow_Super_Giants_IPL_Logo.svg/1200px-Lucknow_Super_Giants_IPL_Logo.svg.png',
    description: 'Led by Rishabh Pant.',
    captain: { name: 'Rishabh Pant', image: '/captains/LSGcaptain.avif', fallbackImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/KL_Rahul_in_2018.jpg/800px-KL_Rahul_in_2018.jpg' }
  },
  RR: {
    id: 'rr', name: 'Rajasthan Royals', shortName: 'RR', color: '#EA1A85',
    logo: '/logos/RRoutline.png', fallbackLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Rajasthan_Royals_Logo.svg/1200px-Rajasthan_Royals_Logo.svg.png',
    description: 'Inaugural champions led by Riyan Parag.',
    captain: { name: 'Riyan Parag', image: '/captains/RRcaptain.avif', fallbackImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Sanju_Samson_in_PMO_New_Delhi.jpg/800px-Sanju_Samson_in_PMO_New_Delhi.jpg' }
  },
  SRH: {
    id: 'srh', name: 'Sunrisers Hyderabad', shortName: 'SRH', color: '#F26522',
    logo: '/logos/SRHoutline.avif', fallbackLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/81/Sunrisers_Hyderabad.svg/1200px-Sunrisers_Hyderabad.svg.png',
    description: 'Explosive batting led by Pat Cummins.',
    captain: { name: 'Pat Cummins', image: '/captains/SRHcaptain.avif', fallbackImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Pat_Cummins_2019.jpg/800px-Pat_Cummins_2019.jpg' }
  },
};

// Realistic Historical Head-to-Head Win Probability (All-time IPL)
// Returns the probability (0 to 100) that team1 beats team2
export const getHistoricalWinProbability = (team1: string, team2: string): number => {
  const h2hMatrix: Record<string, Record<string, number>> = {
    MI: { CSK: 55, RCB: 58, KKR: 72, DC: 52, PBKS: 53, RR: 51, SRH: 56, GT: 45, LSG: 20 },
    CSK: { MI: 45, RCB: 65, KKR: 61, DC: 65, PBKS: 55, RR: 53, SRH: 72, GT: 50, LSG: 50 },
    RCB: { MI: 42, CSK: 35, KKR: 44, DC: 52, PBKS: 48, RR: 50, SRH: 48, GT: 50, LSG: 60 },
    KKR: { MI: 28, CSK: 39, RCB: 56, DC: 54, PBKS: 65, RR: 52, SRH: 60, GT: 33, LSG: 33 },
    GT: { MI: 55, CSK: 50, RCB: 50, KKR: 67, DC: 66, PBKS: 50, RR: 75, SRH: 66, LSG: 80 },
    DC: { MI: 48, CSK: 35, RCB: 48, KKR: 46, PBKS: 52, RR: 50, SRH: 50, GT: 34, LSG: 33 },
    PBKS: { MI: 47, CSK: 45, RCB: 52, KKR: 35, DC: 48, RR: 45, SRH: 35, GT: 50, LSG: 50 },
    LSG: { MI: 80, CSK: 50, RCB: 40, KKR: 67, GT: 20, DC: 67, PBKS: 50, RR: 25, SRH: 67 },
    RR: { MI: 49, CSK: 47, RCB: 50, KKR: 48, GT: 25, DC: 50, PBKS: 55, LSG: 75, SRH: 52 },
    SRH: { MI: 44, CSK: 28, RCB: 52, KKR: 40, GT: 34, DC: 50, PBKS: 65, LSG: 33, RR: 48 },
  };

  if (h2hMatrix[team1] && h2hMatrix[team1][team2]) {
    return h2hMatrix[team1][team2];
  }
  return 50; // default 50% if unknown
};

// ─── REAL IPL 2026 Completed Matches (Matches 1–55) ────────────────────────────
// Sources: iplt20.com (official), ESPNcricinfo, NDTV — verified May 12 2026
export const completedMatches: Match[] = [
  // Match 1–10
  { id: 1, matchNumber: 1, team1: 'RCB', team2: 'SRH', winner: 'RCB', margin: 6, marginType: 'wickets', date: '2026-03-28', venue: 'M. Chinnaswamy Stadium, Bengaluru', status: 'completed' },
  { id: 2, matchNumber: 2, team1: 'KKR', team2: 'MI', winner: 'MI', margin: 6, marginType: 'wickets', date: '2026-03-29', venue: 'Eden Gardens, Kolkata', status: 'completed' },
  { id: 3, matchNumber: 3, team1: 'CSK', team2: 'RR', winner: 'RR', margin: 8, marginType: 'wickets', date: '2026-03-30', venue: 'MA Chidambaram Stadium, Chennai', status: 'completed' },
  { id: 4, matchNumber: 4, team1: 'GT', team2: 'PBKS', winner: 'PBKS', margin: 3, marginType: 'wickets', date: '2026-03-31', venue: 'Narendra Modi Stadium, Ahmedabad', status: 'completed' },
  { id: 5, matchNumber: 5, team1: 'LSG', team2: 'DC', winner: 'DC', margin: 6, marginType: 'wickets', date: '2026-04-01', venue: 'Ekana Stadium, Lucknow', status: 'completed' },
  { id: 6, matchNumber: 6, team1: 'SRH', team2: 'KKR', winner: 'SRH', margin: 65, marginType: 'runs', date: '2026-04-02', venue: 'Rajiv Gandhi Stadium, Hyderabad', status: 'completed' },
  { id: 7, matchNumber: 7, team1: 'CSK', team2: 'PBKS', winner: 'PBKS', margin: 5, marginType: 'wickets', date: '2026-04-03', venue: 'MA Chidambaram Stadium, Chennai', status: 'completed' },
  { id: 8, matchNumber: 8, team1: 'MI', team2: 'DC', winner: 'DC', margin: 6, marginType: 'wickets', date: '2026-04-04', venue: 'Wankhede Stadium, Mumbai', status: 'completed' },
  { id: 9, matchNumber: 9, team1: 'RR', team2: 'GT', winner: 'RR', margin: 6, marginType: 'runs', date: '2026-04-05', venue: 'Sawai Mansingh Stadium, Jaipur', status: 'completed' },
  { id: 10, matchNumber: 10, team1: 'SRH', team2: 'LSG', winner: 'LSG', margin: 5, marginType: 'wickets', date: '2026-04-06', venue: 'Rajiv Gandhi Stadium, Hyderabad', status: 'completed' },

  // Match 11–20
  { id: 11, matchNumber: 11, team1: 'RCB', team2: 'CSK', winner: 'RCB', margin: 43, marginType: 'runs', date: '2026-04-07', venue: 'M. Chinnaswamy Stadium, Bengaluru', status: 'completed' },
  // Match 12: Abandoned due to rain — No Result
  { id: 12, matchNumber: 12, team1: 'KKR', team2: 'PBKS', date: '2026-04-08', venue: 'Eden Gardens, Kolkata', status: 'completed' },
  { id: 13, matchNumber: 13, team1: 'RR', team2: 'MI', winner: 'RR', margin: 27, marginType: 'runs', date: '2026-04-09', venue: 'Sawai Mansingh Stadium, Jaipur', status: 'completed' },
  { id: 14, matchNumber: 14, team1: 'GT', team2: 'DC', winner: 'GT', margin: 1, marginType: 'runs', date: '2026-04-10', venue: 'Narendra Modi Stadium, Ahmedabad', status: 'completed' },
  { id: 15, matchNumber: 15, team1: 'KKR', team2: 'LSG', winner: 'LSG', margin: 3, marginType: 'wickets', date: '2026-04-11', venue: 'Eden Gardens, Kolkata', status: 'completed' },
  { id: 16, matchNumber: 16, team1: 'RCB', team2: 'RR', winner: 'RR', margin: 6, marginType: 'wickets', date: '2026-04-12', venue: 'M. Chinnaswamy Stadium, Bengaluru', status: 'completed' },
  { id: 17, matchNumber: 17, team1: 'SRH', team2: 'PBKS', winner: 'PBKS', margin: 4, marginType: 'runs', date: '2026-04-13', venue: 'Rajiv Gandhi Stadium, Hyderabad', status: 'completed' },
  { id: 18, matchNumber: 18, team1: 'CSK', team2: 'DC', winner: 'CSK', margin: 23, marginType: 'runs', date: '2026-04-14', venue: 'MA Chidambaram Stadium, Chennai', status: 'completed' },
  { id: 19, matchNumber: 19, team1: 'LSG', team2: 'GT', winner: 'GT', margin: 7, marginType: 'wickets', date: '2026-04-15', venue: 'Ekana Stadium, Lucknow', status: 'completed' },
  { id: 20, matchNumber: 20, team1: 'RCB', team2: 'MI', winner: 'RCB', margin: 18, marginType: 'runs', date: '2026-04-16', venue: 'M. Chinnaswamy Stadium, Bengaluru', status: 'completed' },

  // Match 21–30
  { id: 21, matchNumber: 21, team1: 'SRH', team2: 'RR', winner: 'SRH', margin: 57, marginType: 'runs', date: '2026-04-17', venue: 'Rajiv Gandhi Stadium, Hyderabad', status: 'completed' },
  { id: 22, matchNumber: 22, team1: 'CSK', team2: 'KKR', winner: 'CSK', margin: 32, marginType: 'runs', date: '2026-04-18', venue: 'MA Chidambaram Stadium, Chennai', status: 'completed' },
  { id: 23, matchNumber: 23, team1: 'LSG', team2: 'RCB', winner: 'RCB', margin: 5, marginType: 'wickets', date: '2026-04-18', venue: 'Ekana Stadium, Lucknow', status: 'completed' },
  { id: 24, matchNumber: 24, team1: 'MI', team2: 'PBKS', winner: 'PBKS', margin: 7, marginType: 'wickets', date: '2026-04-19', venue: 'Wankhede Stadium, Mumbai', status: 'completed' },
  { id: 25, matchNumber: 25, team1: 'KKR', team2: 'GT', winner: 'GT', margin: 5, marginType: 'wickets', date: '2026-04-19', venue: 'Eden Gardens, Kolkata', status: 'completed' },
  { id: 26, matchNumber: 26, team1: 'RCB', team2: 'DC', winner: 'DC', margin: 6, marginType: 'wickets', date: '2026-04-18', venue: 'M. Chinnaswamy Stadium, Bengaluru', status: 'completed' },
  { id: 27, matchNumber: 27, team1: 'SRH', team2: 'CSK', winner: 'SRH', margin: 10, marginType: 'runs', date: '2026-04-18', venue: 'Rajiv Gandhi Stadium, Hyderabad', status: 'completed' },
  { id: 28, matchNumber: 28, team1: 'RR', team2: 'KKR', winner: 'KKR', margin: 4, marginType: 'wickets', date: '2026-04-19', venue: 'ACA Stadium, Guwahati', status: 'completed' },
  { id: 29, matchNumber: 29, team1: 'PBKS', team2: 'LSG', winner: 'PBKS', margin: 54, marginType: 'runs', date: '2026-04-19', venue: 'HPCA Stadium, Dharamshala', status: 'completed' },
  { id: 30, matchNumber: 30, team1: 'MI', team2: 'GT', winner: 'MI', margin: 99, marginType: 'runs', date: '2026-04-20', venue: 'Wankhede Stadium, Mumbai', status: 'completed' },

  // Match 31–40 (Apr 21 – Apr 28)
  { id: 31, matchNumber: 31, team1: 'SRH', team2: 'DC', winner: 'SRH', margin: 47, marginType: 'runs', date: '2026-04-21', venue: 'Rajiv Gandhi Stadium, Hyderabad', status: 'completed' },
  { id: 32, matchNumber: 32, team1: 'RR', team2: 'LSG', winner: 'RR', margin: 40, marginType: 'runs', date: '2026-04-22', venue: 'Sawai Mansingh Stadium, Jaipur', status: 'completed' },
  { id: 33, matchNumber: 33, team1: 'MI', team2: 'CSK', winner: 'CSK', margin: 103, marginType: 'runs', date: '2026-04-23', venue: 'Wankhede Stadium, Mumbai', status: 'completed' },
  { id: 34, matchNumber: 34, team1: 'RCB', team2: 'GT', winner: 'RCB', margin: 5, marginType: 'wickets', date: '2026-04-24', venue: 'M. Chinnaswamy Stadium, Bengaluru', status: 'completed' },
  { id: 35, matchNumber: 35, team1: 'DC', team2: 'PBKS', winner: 'PBKS', margin: 6, marginType: 'wickets', date: '2026-04-25', venue: 'Arun Jaitley Stadium, Delhi', status: 'completed' },
  { id: 36, matchNumber: 36, team1: 'RR', team2: 'SRH', winner: 'SRH', margin: 5, marginType: 'wickets', date: '2026-04-25', venue: 'Sawai Mansingh Stadium, Jaipur', status: 'completed' },
  { id: 37, matchNumber: 37, team1: 'CSK', team2: 'GT', winner: 'GT', margin: 8, marginType: 'wickets', date: '2026-04-26', venue: 'MA Chidambaram Stadium, Chennai', status: 'completed' },
  // Match 38: Tied at 155 — KKR won Super Over
  { id: 38, matchNumber: 38, team1: 'LSG', team2: 'KKR', winner: 'KKR', margin: 0, marginType: 'runs', date: '2026-04-27', venue: 'Ekana Stadium, Lucknow', status: 'completed' },
  { id: 39, matchNumber: 39, team1: 'DC', team2: 'RCB', winner: 'RCB', margin: 9, marginType: 'wickets', date: '2026-04-27', venue: 'Arun Jaitley Stadium, Delhi', status: 'completed' },
  { id: 40, matchNumber: 40, team1: 'PBKS', team2: 'RR', winner: 'RR', margin: 6, marginType: 'wickets', date: '2026-04-28', venue: 'HPCA Stadium, Dharamshala', status: 'completed' },

  // Match 41–50 (Apr 29 – May 7)
  { id: 41, matchNumber: 41, team1: 'MI', team2: 'SRH', winner: 'SRH', margin: 6, marginType: 'wickets', date: '2026-04-29', venue: 'Wankhede Stadium, Mumbai', status: 'completed' },
  { id: 42, matchNumber: 42, team1: 'RCB', team2: 'GT', winner: 'GT', margin: 4, marginType: 'wickets', date: '2026-04-30', venue: 'Narendra Modi Stadium, Ahmedabad', status: 'completed' },
  { id: 43, matchNumber: 43, team1: 'RR', team2: 'DC', winner: 'DC', margin: 7, marginType: 'wickets', date: '2026-05-01', venue: 'Sawai Mansingh Stadium, Jaipur', status: 'completed' },
  { id: 44, matchNumber: 44, team1: 'CSK', team2: 'MI', winner: 'CSK', margin: 8, marginType: 'wickets', date: '2026-05-02', venue: 'MA Chidambaram Stadium, Chennai', status: 'completed' },
  { id: 45, matchNumber: 45, team1: 'SRH', team2: 'KKR', winner: 'KKR', margin: 7, marginType: 'wickets', date: '2026-05-03', venue: 'Rajiv Gandhi Stadium, Hyderabad', status: 'completed' },
  { id: 46, matchNumber: 46, team1: 'PBKS', team2: 'GT', winner: 'GT', margin: 4, marginType: 'wickets', date: '2026-05-03', venue: 'HPCA Stadium, Dharamshala', status: 'completed' },
  { id: 47, matchNumber: 47, team1: 'MI', team2: 'LSG', winner: 'MI', margin: 6, marginType: 'wickets', date: '2026-05-04', venue: 'Wankhede Stadium, Mumbai', status: 'completed' },
  { id: 48, matchNumber: 48, team1: 'DC', team2: 'CSK', winner: 'CSK', margin: 8, marginType: 'wickets', date: '2026-05-05', venue: 'Arun Jaitley Stadium, Delhi', status: 'completed' },
  { id: 49, matchNumber: 49, team1: 'SRH', team2: 'PBKS', winner: 'SRH', margin: 33, marginType: 'runs', date: '2026-05-06', venue: 'Rajiv Gandhi International Stadium, Hyderabad', status: 'completed' },
  { id: 50, matchNumber: 50, team1: 'LSG', team2: 'RCB', winner: 'LSG', margin: 9, marginType: 'runs', date: '2026-05-07', venue: 'Ekana Stadium, Lucknow', status: 'completed' },

  // Match 51–56
  { id: 51, matchNumber: 51, team1: 'DC', team2: 'KKR', winner: 'KKR', margin: 8, marginType: 'wickets', date: '2026-05-08', venue: 'Arun Jaitley Stadium, Delhi', status: 'completed' },
  { id: 52, matchNumber: 52, team1: 'RR', team2: 'GT', winner: 'GT', margin: 77, marginType: 'runs', date: '2026-05-09', venue: 'Sawai Mansingh Stadium, Jaipur', status: 'completed' },
  { id: 53, matchNumber: 53, team1: 'CSK', team2: 'LSG', winner: 'CSK', margin: 5, marginType: 'wickets', date: '2026-05-10', venue: 'MA Chidambaram Stadium, Chennai', status: 'completed' },
  { id: 54, matchNumber: 54, team1: 'RCB', team2: 'MI', winner: 'RCB', margin: 2, marginType: 'wickets', date: '2026-05-10', venue: 'Shaheed Veer Narayan Singh International Stadium, Raipur', status: 'completed' },
  { id: 55, matchNumber: 55, team1: 'PBKS', team2: 'DC', winner: 'DC', margin: 3, marginType: 'wickets', date: '2026-05-11', venue: 'HPCA Stadium, Dharamsala', status: 'completed' },
  { id: 56, matchNumber: 56, team1: 'GT', team2: 'SRH', winner: 'GT', margin: 82, marginType: 'runs', date: '2026-05-12', venue: 'Narendra Modi Stadium, Ahmedabad', status: 'completed' },
];

// ─── Upcoming Matches (57–70) ──────────────────────────────────────────────────
export const upcomingMatches: Match[] = [
  { id: 57, matchNumber: 57, team1: 'RCB', team2: 'KKR', date: '2026-05-13', venue: 'Shaheed Veer Narayan Singh International Stadium, Raipur', status: 'pending' },
  { id: 58, matchNumber: 58, team1: 'PBKS', team2: 'MI', date: '2026-05-14', venue: 'HPCA Stadium, Dharamshala', status: 'pending' },
  { id: 59, matchNumber: 59, team1: 'LSG', team2: 'CSK', date: '2026-05-15', venue: 'Ekana Stadium, Lucknow', status: 'pending' },
  { id: 60, matchNumber: 60, team1: 'KKR', team2: 'GT', date: '2026-05-16', venue: 'Eden Gardens, Kolkata', status: 'pending' },
  { id: 61, matchNumber: 61, team1: 'PBKS', team2: 'RCB', date: '2026-05-17', venue: 'HPCA Stadium, Dharamshala', status: 'pending' },
  { id: 62, matchNumber: 62, team1: 'DC', team2: 'RR', date: '2026-05-17', venue: 'Arun Jaitley Stadium, Delhi', status: 'pending' },
  { id: 63, matchNumber: 63, team1: 'CSK', team2: 'SRH', date: '2026-05-18', venue: 'MA Chidambaram Stadium, Chennai', status: 'pending' },
  { id: 64, matchNumber: 64, team1: 'RR', team2: 'LSG', date: '2026-05-19', venue: 'Sawai Mansingh Stadium, Jaipur', status: 'pending' },
  { id: 65, matchNumber: 65, team1: 'KKR', team2: 'MI', date: '2026-05-20', venue: 'Eden Gardens, Kolkata', status: 'pending' },
  { id: 66, matchNumber: 66, team1: 'GT', team2: 'CSK', date: '2026-05-21', venue: 'Narendra Modi Stadium, Ahmedabad', status: 'pending' },
  { id: 67, matchNumber: 67, team1: 'SRH', team2: 'RCB', date: '2026-05-22', venue: 'Rajiv Gandhi International Stadium, Hyderabad', status: 'pending' },
  { id: 68, matchNumber: 68, team1: 'LSG', team2: 'PBKS', date: '2026-05-23', venue: 'Ekana Stadium, Lucknow', status: 'pending' },
  { id: 69, matchNumber: 69, team1: 'MI', team2: 'RR', date: '2026-05-24', venue: 'Wankhede Stadium, Mumbai', status: 'pending' },
  { id: 70, matchNumber: 70, team1: 'KKR', team2: 'DC', date: '2026-05-24', venue: 'Eden Gardens, Kolkata', status: 'pending' },
];

export const allMatches = [...completedMatches, ...upcomingMatches];

// ─── IPL 2026 Official Points Table after Match 56 ───────────────────────────
// Source: iplt20.com/matches/points-table (verified May 12 2026)
export const currentPointsTable: PointsTableEntry[] = [
  { team: 'RCB',  matches: 11, wins: 7, losses: 4, points: 14, nrr:  1.103, qualificationChance: 87 },
  { team: 'SRH',  matches: 12, wins: 7, losses: 5, points: 14, nrr:  0.327, qualificationChance: 58 },
  { team: 'GT',   matches: 12, wins: 8, losses: 4, points: 16, nrr:  0.638, qualificationChance: 96 },
  { team: 'PBKS', matches: 11, wins: 6, losses: 4, noResults: 1, points: 13, nrr: 0.428, qualificationChance: 63 },
  { team: 'CSK', matches: 11, wins: 6, losses: 5, noResults: 0, points: 12, nrr: 0.185, qualificationChance: 38 },
  { team: 'RR', matches: 11, wins: 6, losses: 5, noResults: 0, points: 12, nrr: 0.082, qualificationChance: 29 },
  { team: 'DC', matches: 12, wins: 5, losses: 7, noResults: 0, points: 10, nrr: -0.993, qualificationChance: 0 },
  { team: 'KKR', matches: 10, wins: 4, losses: 5, noResults: 1, points: 9, nrr: -0.169, qualificationChance: 9 },
  { team: 'MI', matches: 11, wins: 3, losses: 8, noResults: 0, points: 6, nrr: -0.585, qualificationChance: 0 },
  { team: 'LSG', matches: 11, wins: 3, losses: 8, noResults: 0, points: 6, nrr: -0.907, qualificationChance: 0 },
];

// ─── Probability Trends (based on real match progression) ──────────────────────
export const probabilityHistory: ProbabilityEntry[] = [
  { matchNumber: 10, probabilities: { PBKS: 72, RCB: 68, SRH: 58, RR: 62, GT: 55, CSK: 45, DC: 40, KKR: 42, MI: 35, LSG: 30 } },
  { matchNumber: 20, probabilities: { PBKS: 78, RCB: 74, SRH: 62, RR: 66, GT: 58, CSK: 42, DC: 38, KKR: 44, MI: 28, LSG: 32 } },
  { matchNumber: 30, probabilities: { PBKS: 85, RCB: 80, SRH: 70, RR: 72, GT: 65, CSK: 40, DC: 30, KKR: 35, MI: 22, LSG: 20 } },
  { matchNumber: 40, probabilities: { PBKS: 88, RCB: 84, SRH: 78, RR: 65, GT: 72, CSK: 46, DC: 18, KKR: 42, MI: 12, LSG: 10 } },
  { matchNumber: 48, probabilities: { PBKS: 90, RCB: 92, SRH: 80, RR: 52, GT: 76, CSK: 48, DC: 14, KKR: 52, MI: 6, LSG: 6 } },
  { matchNumber: 55, probabilities: { PBKS: 85, RCB: 98, SRH: 88, RR: 30, GT: 88, CSK: 58, DC: 2, KKR: 60, MI: 0, LSG: 8 } },
];
