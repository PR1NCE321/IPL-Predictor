import { Match, PointsTableEntry, Team } from '@/types';
import { getHistoricalWinProbability, currentPointsTable } from '@/data/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WinProbabilityResult {
  probabilities: Record<Team, number>;
  confidence: 'high' | 'medium' | 'low';
  signals: {
    historical: number;      // base h2h %
    venueAdj: number;        // venue home advantage delta
    formAdj: number;         // last-5 form delta
    tableAdj: number;        // points table delta
    liveAdj: number;         // in-play delta
    tossAdj: number;         // toss decision delta
  };
}

export interface QualificationResult {
  probabilities: Record<Team, number>;
  eliminatedTeams: Team[];      // teams with 0% chance
  safeTeams: Team[];            // teams with 99%+ chance
  topContenders: Team[];        // top 4 most likely
}

const ALL_TEAMS: Team[] = ['MI', 'CSK', 'RCB', 'KKR', 'GT', 'DC', 'PBKS', 'LSG', 'RR', 'SRH'];

function zeroProbs(): Record<Team, number> {
  return Object.fromEntries(ALL_TEAMS.map(t => [t, 0])) as Record<Team, number>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// IPL average: ~55% win rate batting first overall (venue-adjusted below)
// These are rough home-ground boost percentages per team
const VENUE_BOOST: Partial<Record<Team, number>> = {
  MI:   3.5,   // Wankhede - batting friendly, slight home boost
  CSK:  4.0,   // Chepauk - spin conditions, strong home record
  RCB:  2.0,   // Chinnaswamy - high-scoring, less venue advantage
  KKR:  3.0,   // Eden Gardens - rowdy crowd factor
  GT:   4.5,   // Narendra Modi - huge stadium, strong home form
  DC:   2.5,   // Arun Jaitley - neutral-ish
  PBKS: 2.0,   // Mullanpur/Mohali - newer venue
  LSG:  3.0,   // BRSABV - decent home advantage
  RR:   3.5,   // Sawai Man Singh - spin-friendly
  SRH:  3.5,   // Rajiv Gandhi - good batting track, loud crowd
};

// Recent form weight: exponential decay over last 5 matches
// Index 0 = most recent match
const FORM_WEIGHTS = [0.35, 0.25, 0.20, 0.12, 0.08];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Clamp a value between min and max.
 */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Normalise two raw probabilities so they sum to 100.
 */
function normalise(p1: number, p2: number): [number, number] {
  const total = p1 + p2;
  if (total === 0) return [50, 50];
  return [Math.round((p1 / total) * 100), Math.round((p2 / total) * 100)];
}

/**
 * Venue adjustment: if team1 is playing at their home ground,
 * boost their probability by their VENUE_BOOST, and vice versa.
 */
function venueAdjustment(match: Match): number {
  if (!match.venue) return 0;
  const venue = match.venue.toLowerCase();

  const homeKeywords: Partial<Record<Team, string[]>> = {
    MI:   ['wankhede', 'mumbai'],
    CSK:  ['chepauk', 'chennai', 'ma chidambaram'],
    RCB:  ['chinnaswamy', 'bengaluru', 'bangalore'],
    KKR:  ['eden', 'kolkata'],
    GT:   ['narendra modi', 'ahmedabad', 'motera'],
    DC:   ['arun jaitley', 'feroz shah', 'delhi'],
    PBKS: ['mullanpur', 'mohali', 'dharamsala'],
    LSG:  ['brsabv', 'lucknow', 'ekana'],
    RR:   ['sawai man singh', 'jaipur'],
    SRH:  ['rajiv gandhi', 'hyderabad', 'uppal'],
  };

  const isHome = (team: Team) =>
    (homeKeywords[team] ?? []).some(kw => venue.includes(kw));

  if (isHome(match.team1)) return VENUE_BOOST[match.team1] ?? 0;
  if (isHome(match.team2)) return -(VENUE_BOOST[match.team2] ?? 0);
  return 0;
}

/**
 * Recent form adjustment: uses the team's last 5 results with
 * exponential weighting. Returns delta for team1 (negative = team2 advantage).
 */
function formAdjustment(match: Match, pointsTable: PointsTableEntry[]): number {
  const e1 = pointsTable.find(p => p.team === match.team1);
  const e2 = pointsTable.find(p => p.team === match.team2);

  // recentForm is an array like [true, true, false, true, false] (win=true)
  // If your data model doesn't have this, fall back to 0
  const form1: boolean[] = (e1 as any)?.recentForm ?? [];
  const form2: boolean[] = (e2 as any)?.recentForm ?? [];

  const score = (form: boolean[]) =>
    form.slice(0, 5).reduce((acc, win, i) => acc + (win ? 1 : -1) * FORM_WEIGHTS[i], 0);

  const delta = (score(form1) - score(form2)) * 8; // scale to [-8, +8]
  return clamp(delta, -8, 8);
}

/**
 * Points table adjustment: wider range than original (+/- 10 max),
 * accounts for both raw points gap AND NRR gap.
 */
function tableAdjustment(match: Match, pointsTable: PointsTableEntry[]): number {
  const e1 = pointsTable.find(p => p.team === match.team1);
  const e2 = pointsTable.find(p => p.team === match.team2);
  if (!e1 || !e2) return 0;

  const pointsDelta = (e1.points - e2.points) * 1.5;  // each 2-pt gap ≈ 3% boost
  const nrrDelta    = (e1.nrr - e2.nrr) * 4;          // NRR gap (usually -2 to +2)
  return clamp(pointsDelta + nrrDelta, -10, 10);
}

/**
 * Live match adjustment: improved DLS-style calculation.
 * Considers runs required, wickets in hand, balls remaining.
 */
function liveAdjustment(match: Match): number {
  if (match.status !== 'live' || !match.liveScore) return 0;
  const live = match.liveScore;
  const batting = live.team;
  let delta = 0;

  // Run-rate ratio gives base momentum
  if (
    typeof live.currentRunRate === 'number' &&
    typeof live.requiredRunRate === 'number' &&
    live.requiredRunRate > 0
  ) {
    const rrRatio = live.currentRunRate / live.requiredRunRate;
    // Use a sigmoid-like curve instead of linear for more realistic modelling
    const rrDelta = clamp((rrRatio - 1) * 40, -25, 25);
    delta += rrDelta;
  }

  // Wickets in hand: 10 wickets = 0 penalty, 0 wickets = -30
  if (typeof live.wickets === 'number') {
    const wicketsInHand = 10 - live.wickets;
    // non-linear: last 3 wickets matter most
    const wicketBonus = wicketsInHand >= 7
      ? 0
      : ((wicketsInHand - 7) * 4); // −4 per wicket below 7, so max −28
    delta += wicketBonus;
  }

  // Balls remaining: very late in innings, pressure rises sharply
  if (typeof (live as any).ballsRemaining === 'number') {
    const balls = (live as any).ballsRemaining as number;
    if (balls <= 6 && delta < 0) delta *= 1.3;   // amplify pressure
    if (balls <= 12 && delta > 0) delta *= 1.15; // amplify comfort
  }

  const isBattingTeam1 = batting === match.team1;
  return isBattingTeam1 ? clamp(delta, -35, 35) : clamp(-delta, -35, 35);
}

/**
 * Toss adjustment: In modern T20s, chasing (bowling first) often provides a slight advantage,
 * but this varies by venue. A basic baseline is a ~2-3% boost for winning the toss and chasing.
 */
function tossAdjustment(match: Match): number {
  if (!match.tossWinner || !match.tossChoice) return 0;
  
  // Example baseline: If team1 wins toss and bowls (chases), small boost.
  const isTeam1TossWinner = match.tossWinner === match.team1;
  const choseToChase = match.tossChoice === 'field';
  
  let delta = 0;
  if (choseToChase) {
    delta = 2.5; // 2.5% boost for chasing
  } else {
    delta = -1.0; // slight penalty for choosing to bat first (statistically harder in many venues)
  }
  
  return isTeam1TossWinner ? delta : -delta;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Estimate win probability for a match using multiple signal layers.
 * Returns full result with per-signal breakdown for debugging/display.
 * 
 * Signals:
 * - historical: Base win rate from past matchups
 * - venueAdj: Home ground advantage (+/- 2 to 4.5%)
 * - formAdj: Recent form momentum (up to +/- 8%)
 * - tableAdj: Standings dominance gap (up to +/- 10%)
 * - liveAdj: In-play momentum based on RRR and wickets (up to +/- 35%)
 * - tossAdj: Toss decision impact (+/- 1 to 2.5%)
 */
export function estimateWinProbabilityDetailed(
  match: Match,
  pointsTable: PointsTableEntry[] = currentPointsTable
): WinProbabilityResult {
  const probabilities = zeroProbs();

  if (match.status === 'completed' && match.winner) {
    probabilities[match.winner] = 100;
    return {
      probabilities,
      confidence: 'high',
      signals: { historical: 0, venueAdj: 0, formAdj: 0, tableAdj: 0, liveAdj: 0, tossAdj: 0 },
    };
  }

  const historical = getHistoricalWinProbability(match.team1, match.team2);
  const venueAdj   = venueAdjustment(match);
  const formAdj    = formAdjustment(match, pointsTable);
  const tableAdj   = tableAdjustment(match, pointsTable);
  const liveAdj    = liveAdjustment(match);
  const tossAdj    = tossAdjustment(match);

  let raw1 = historical + venueAdj + formAdj + tableAdj + liveAdj + tossAdj;
  raw1 = clamp(raw1, 1, 99);
  const raw2 = 100 - raw1;

  const [p1, p2] = normalise(raw1, raw2);
  probabilities[match.team1] = p1;
  probabilities[match.team2] = p2;

  // Confidence: high when signals agree strongly, low when contradictory
  const signalMagnitude = Math.abs(venueAdj) + Math.abs(formAdj) + Math.abs(tableAdj) + Math.abs(liveAdj) + Math.abs(tossAdj);
  const confidence: 'high' | 'medium' | 'low' =
    signalMagnitude > 15 ? 'high' :
    signalMagnitude > 7  ? 'medium' : 'low';

  return {
    probabilities,
    confidence,
    signals: { historical, venueAdj, formAdj, tableAdj, liveAdj, tossAdj },
  };
}

/**
 * Simplified version — drop-in replacement for your original.
 */
export function estimateWinProbability(
  match: Match,
  pointsTable: PointsTableEntry[] = currentPointsTable
): Record<Team, number> {
  return estimateWinProbabilityDetailed(match, pointsTable).probabilities;
}

/**
 * Pick a weighted random winner for simulation.
 */
export function pickWeightedWinner(
  match: Match,
  pointsTable: PointsTableEntry[] = currentPointsTable
): Team {
  const probs = estimateWinProbability(match, pointsTable);
  const p1 = probs[match.team1] || 50;
  const p2 = probs[match.team2] || 50;
  return Math.random() * (p1 + p2) < p1 ? match.team1 : match.team2;
}

/**
 * Estimate winning margin — unchanged but slightly improved ranges.
 */
export function estimateMargin(
  match: Match,
  winner: Team
): { marginType: 'runs' | 'wickets'; marginValue: number } {
  const isRunsWin = Math.random() > 0.45;
  if (isRunsWin) {
    // Larger margins when batting first team wins (they set a big target)
    const marginValue = winner === match.team1
      ? Math.floor(Math.random() * 45) + 5
      : Math.floor(Math.random() * 60) + 1;
    return { marginType: 'runs', marginValue };
  }
  return { marginType: 'wickets', marginValue: clamp(Math.floor(Math.random() * 7) + 1, 1, 10) };
}

// ─── Qualification probability ─────────────────────────────────────────────────

/**
 * Calculate qualification probabilities via Monte Carlo simulation.
 *
 * Improvements over v1:
 * - 10,000 iterations (was 5,000) for tighter confidence intervals
 * - NRR noise is drawn from team-specific variance, not uniform ±0.05
 * - Upset factor: occasional heavy NRR swings simulate blow-out wins
 * - Pre-caches all match probabilities for speed
 * - Returns richer result with eliminated/safe/contender classification
 */
export function calculateQualificationProbabilities(
  matches: Match[],
  pointsTable: PointsTableEntry[],
  iterations = 10_000
): QualificationResult {
  const pending = matches.filter(m => m.status === 'pending' || m.status === 'live');

  // If tournament is over, classify deterministically
  if (pending.length === 0) {
    const sorted = [...pointsTable].sort((a, b) =>
      b.points !== a.points ? b.points - a.points : b.nrr - a.nrr
    );
    const probs = zeroProbs();
    sorted.forEach((t, i) => { probs[t.team as Team] = i < 4 ? 100 : 0; });
    const top4 = sorted.slice(0, 4).map(t => t.team as Team);
    const bottom6 = sorted.slice(4).map(t => t.team as Team);
    return { probabilities: probs, eliminatedTeams: bottom6, safeTeams: top4, topContenders: top4 };
  }

  // Pre-calculate match probabilities (expensive — do once)
  const matchProbs = pending.map(m => ({
    team1: m.team1,
    team2: m.team2,
    prob1: getHistoricalWinProbability(m.team1, m.team2)
            + venueAdjustment(m)
            + tableAdjustment(m, pointsTable),
  }));

  // Build a per-team NRR standard deviation from their current NRR volatility
  // Higher NRR (dominant team) → more consistent → lower variance
  const nrrStdDev: Record<string, number> = {};
  pointsTable.forEach(p => {
    // Teams with extreme NRRs have higher variance in simulation
    nrrStdDev[p.team] = 0.12 + Math.abs(p.nrr) * 0.04;
  });

  const qualCounts: Record<string, number> = {};
  pointsTable.forEach(p => { qualCounts[p.team] = 0; });

  for (let i = 0; i < iterations; i++) {
    const simPoints: Record<string, number> = {};
    const simNrr: Record<string, number> = {};

    pointsTable.forEach(p => {
      simPoints[p.team] = p.points;
      simNrr[p.team] = p.nrr;
    });

    for (const mp of matchProbs) {
      const prob1Adjusted = clamp(mp.prob1, 2, 98);
      const isTeam1Win = (Math.random() * 100) < prob1Adjusted;
      const winner = isTeam1Win ? mp.team1 : mp.team2;
      const loser  = isTeam1Win ? mp.team2 : mp.team1;

      simPoints[winner] += 2;

      // NRR: winning team gets a positive nudge, losing team a negative one.
      // Occasionally simulate a blow-out (5% chance) for heavy NRR swings.
      const blowout = Math.random() < 0.05;
      const nrrSwing = blowout
        ? (Math.random() * 0.5 + 0.3)  // big swing: +0.3 to +0.8
        : (Math.random() * nrrStdDev[winner]);
      simNrr[winner] += nrrSwing;
      simNrr[loser]  -= nrrSwing * 0.8; // loser's NRR drops slightly less (asymmetric)
    }

    // Sort by points then NRR
    const sorted = Object.keys(simPoints).sort((a, b) => {
      if (simPoints[b] !== simPoints[a]) return simPoints[b] - simPoints[a];
      return simNrr[b] - simNrr[a];
    });

    for (let j = 0; j < 4; j++) qualCounts[sorted[j]]++;
  }

  const probs = zeroProbs();
  pointsTable.forEach(p => {
    probs[p.team as Team] = Math.round((qualCounts[p.team] / iterations) * 100);
  });

  // Classify teams
  const sortedByProb = [...pointsTable].sort(
    (a, b) => (probs[b.team as Team] ?? 0) - (probs[a.team as Team] ?? 0)
  );
  const eliminatedTeams = pointsTable
    .filter(p => probs[p.team as Team] === 0)
    .map(p => p.team as Team);
  const safeTeams = pointsTable
    .filter(p => probs[p.team as Team] >= 99)
    .map(p => p.team as Team);
  const topContenders = sortedByProb.slice(0, 4).map(p => p.team as Team);

  return { probabilities: probs, eliminatedTeams, safeTeams, topContenders };
}

/**
 * Scenario analysis: given a single match outcome (what if X wins?),
 * recalculate the impact on every team's qualification odds.
 * Useful for "if CSK beats MI tonight, what happens?" UI.
 */
export function calculateScenarioImpact(
  hypotheticalWinner: Team,
  hypotheticalMatch: Match,
  allMatches: Match[],
  pointsTable: PointsTableEntry[],
  iterations = 5_000
): Record<Team, { before: number; after: number; delta: number }> {
  // Baseline
  const baseline = calculateQualificationProbabilities(allMatches, pointsTable, iterations);

  // Build modified inputs: mark hypothetical match as completed
  const modifiedMatches = allMatches.map(m =>
    m.id === hypotheticalMatch.id
      ? { ...m, status: 'completed' as const, winner: hypotheticalWinner }
      : m
  );

  // Update points table
  const modifiedTable = pointsTable.map(p =>
    p.team === hypotheticalWinner ? { ...p, points: p.points + 2 } : p
  );

  const scenario = calculateQualificationProbabilities(modifiedMatches, modifiedTable, iterations);

  const result = {} as Record<Team, { before: number; after: number; delta: number }>;
  ALL_TEAMS.forEach(t => {
    const before = baseline.probabilities[t] ?? 0;
    const after  = scenario.probabilities[t] ?? 0;
    result[t] = { before, after, delta: after - before };
  });
  return result;
}
