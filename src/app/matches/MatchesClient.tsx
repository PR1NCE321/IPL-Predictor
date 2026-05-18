"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronDown, Clock, Flame, MapPin, Timer, Trophy, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';
import type { Match, Team } from '@/types';
import { getHistoricalWinProbability, teamInfo } from '@/data/mockData';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';
import GlobalLoader from '@/components/GlobalLoader';

/* ── Color palette for dark-theme readability ── */
const C = {
  white: '#FFFFFF',
  textPrimary: '#F0F2F5',
  textSecondary: '#C5CBD6',
  textMuted: '#9AA2B5',
  gold: '#D4AF37',
  goldGlow: 'rgba(212,175,55,0.18)',
  cardBg: '#131620',
  cardBorder: '#1F2233',
  cardHoverBorder: 'rgba(212,175,55,0.4)',
  deepBg: '#0D0F14',
  accentGreen: '#34D399',
  accentRed: '#F87171',
  liveRed: '#EF4444',
};

const venueColors: Record<string, string> = {
  Mumbai: '#0078D7', Wankhede: '#0078D7',
  Bengaluru: '#E8003D', Chinnaswamy: '#E8003D',
  Chennai: '#D4AF37', Chepauk: '#D4AF37', 'MA Chidambaram': '#D4AF37',
  Kolkata: '#6B21A8', 'Eden Gardens': '#6B21A8',
  Hyderabad: '#F97316', 'Rajiv Gandhi': '#F97316',
  Ahmedabad: '#1D9E75', 'Narendra Modi': '#1D9E75',
  Delhi: '#3B82F6', 'Arun Jaitley': '#3B82F6',
  Jaipur: '#EC4899', 'Sawai Mansingh': '#EC4899',
  Mohali: '#EF4444', Dharamsala: '#10B981',
  Lucknow: '#06B6D4', BRSABV: '#06B6D4', Ekana: '#06B6D4',
};

function getVenueColor(venue: string): string {
  for (const [key, color] of Object.entries(venueColors)) {
    if (venue.includes(key)) return color;
  }
  return '#8890A0';
}

function getVenueCity(venue: string): string {
  return venue.split(',')[0].trim();
}

function groupByDate<T extends { date: string }>(matches: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const match of matches) {
    if (!groups[match.date]) groups[match.date] = [];
    groups[match.date].push(match);
  }
  return groups;
}

function getWinStreak(team: Team, completedMatches: Match[]): number {
  const teamMatches = completedMatches.filter((match) => match.team1 === team || match.team2 === team).reverse();
  let streak = 0;
  for (const match of teamMatches) {
    if (match.winner === team) streak += 1;
    else break;
  }
  return streak;
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  if (normalized.getTime() === today.getTime()) return 'Today';
  if (normalized.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getStatusLabel(match: Match): string {
  if (match.status === 'completed') {
    if (!match.winner) return 'Completed';
    const margin = match.margin ? ` by ${match.margin} ${match.marginType || 'runs'}` : '';
    return `${match.winner} won${margin}`;
  }

  if (match.status === 'live') return 'Live now';
  if (match.date === new Date().toISOString().split('T')[0]) return 'Today';
  return 'Upcoming';
}

type TabType = 'all' | 'upcoming' | 'completed';

/* ── Team badge with bright text ── */
function TeamMark({ team }: { team: Team }) {
  const info = teamInfo[team];

  return (
    <div className='flex items-center gap-2'>
      <div className='w-8 h-8 rounded-full overflow-hidden shrink-0' style={{ background: C.deepBg, border: `1px solid ${C.cardBorder}` }}>
        <img src={info.logo} alt={team} className='w-full h-full object-contain p-1' />
      </div>
      <div>
        <p className='font-bold text-sm team-abbr' style={{ fontFamily: 'var(--font-barlow)', color: C.white }}>{team}</p>
        <p style={{ fontSize: 11, color: C.textSecondary }}>{info.name}</p>
      </div>
    </div>
  );
}

/* ── Individual match card ── */
function MatchCard({ match }: { match: Match }) {
  const team1 = teamInfo[match.team1];
  const team2 = teamInfo[match.team2];
  const isCompleted = match.status === 'completed';
  const probability = getHistoricalWinProbability(match.team1, match.team2);
  const isLive = match.status === 'live';

  return (
    <div
      className={`match-card p-4 md:p-5 ${isLive ? 'match-today' : ''}`}
      style={{
        background: C.cardBg,
        borderColor: isLive ? C.liveRed : C.cardBorder,
      }}
    >
      {/* Header */}
      <div className='flex items-start justify-between gap-4 mb-4'>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, fontWeight: 600 }}>
            {match.title || `Match ${match.matchNumber}`}
          </p>
          <p className='text-sm font-semibold' style={{ color: isCompleted ? C.accentGreen : C.white, marginTop: 2 }}>
            {getStatusLabel(match)}
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: C.textSecondary }}>
          <div className='flex items-center gap-1 justify-end'><Calendar size={12} /> {formatDate(match.date)}</div>
          <div className='flex items-center gap-1 justify-end' style={{ marginTop: 4 }}><MapPin size={12} /> {getVenueCity(match.venue)}</div>
        </div>
      </div>

      {/* Teams grid */}
      <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
        <div className='flex flex-col items-center text-center gap-2'>
          <div className='w-14 h-14 rounded-full overflow-hidden border-2' style={{ borderColor: team1.color, background: C.deepBg }}>
            <img src={team1.captain.image} alt={team1.captain.name} className='w-full h-full object-cover' onError={(event) => { (event.target as HTMLImageElement).src = team1.captain.fallbackImage || ''; }} />
          </div>
          <TeamMark team={match.team1} />
        </div>

        <div className='px-2 text-center'>
          <p className='vs-text text-xl md:text-2xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: C.textMuted }}>VS</p>
          {isCompleted ? (
            <p style={{ marginTop: 8, fontSize: 11, color: C.textSecondary }}>
              Winner: <span style={{ color: C.gold, fontWeight: 700 }}>{match.winner}</span>
            </p>
          ) : (
            <p style={{ marginTop: 8, fontSize: 11, color: C.textSecondary }}>
              H2H edge: <span style={{ color: C.gold, fontWeight: 700 }}>{Math.round(probability)}%</span> {match.team1}
            </p>
          )}
        </div>

        <div className='flex flex-col items-center text-center gap-2'>
          <div className='w-14 h-14 rounded-full overflow-hidden border-2' style={{ borderColor: team2.color, background: C.deepBg }}>
            <img src={team2.captain.image} alt={team2.captain.name} className='w-full h-full object-cover' onError={(event) => { (event.target as HTMLImageElement).src = team2.captain.fallbackImage || ''; }} />
          </div>
          <TeamMark team={match.team2} />
        </div>
      </div>

      {/* Footer meta */}
      <div className='mt-4 flex flex-wrap items-center gap-3' style={{ fontSize: 12, color: C.textSecondary }}>
        <span className='flex items-center gap-1'><Timer size={12} /> {match.status === 'live' ? 'In progress' : 'Scheduled'}</span>
        <span className='flex items-center gap-1'><Flame size={12} /> {getVenueColor(match.venue) !== '#8890A0' ? `Venue form: ${getVenueCity(match.venue)}` : 'Neutral venue'}</span>
      </div>
    </div>
  );
}

/* ── Date group section ── */
function DateSection({ title, matches }: { title: string; matches: Match[] }) {
  if (matches.length === 0) return null;

  return (
    <section className='space-y-3'>
      <div className='flex items-center justify-between'>
        <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>{title}</p>
        <ChevronDown size={14} style={{ color: C.textMuted }} />
      </div>
      <div className='grid grid-cols-1 gap-4'>
        {matches.map((match) => <MatchCard key={match.id} match={match} />)}
      </div>
    </section>
  );
}

/* ── Main page component ── */
export default function MatchesClient() {
  const { matches, pointsTable, loading, error } = useLiveSystemData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamParam = searchParams.get('team');
  const selectedTeam = teamParam && teamParam in teamInfo ? (teamParam as Team) : 'ALL';
  const [activeTab, setActiveTab] = useState<TabType>('all');

  if (loading || !matches) {
    return <GlobalLoader />;
  }

  const today = new Date().toISOString().split('T')[0];
  const allCompleted = matches.filter((match) => match.status === 'completed');
  const allUpcoming = matches.filter((match) => match.status === 'pending' || match.status === 'live');

  const predicate = selectedTeam === 'ALL'
    ? () => true
    : (match: Match) => match.team1 === selectedTeam || match.team2 === selectedTeam;

  const filteredMatches = {
    completed: allCompleted.filter(predicate).slice().reverse(),
    upcoming: allUpcoming.filter(predicate),
  };

  const spotlightMatch = filteredMatches.upcoming.find((match) => match.status === 'live') || filteredMatches.upcoming[0] || null;
  const remainingUpcoming = spotlightMatch ? filteredMatches.upcoming.filter((match) => match.id !== spotlightMatch.id) : filteredMatches.upcoming;
  const upcomingGroups = groupByDate(remainingUpcoming);
  const completedGroups = groupByDate(filteredMatches.completed);
  const topTeam = pointsTable?.[0] ?? null;
  const filteredLiveCount = filteredMatches.upcoming.filter((match) => match.status === 'live').length;
  const completedCount = filteredMatches.completed.length;
  const upcomingCount = filteredMatches.upcoming.length;
  const allTeamKeys = (Object.keys(teamInfo) as Team[]).filter(k => k !== 'TBD');

  /* ── Pill styles ── */
  const pillBase: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: C.cardBorder,
    transition: 'all 150ms ease',
  };
  const pillActive: React.CSSProperties = { ...pillBase, background: C.gold, color: C.deepBg, borderColor: C.gold };
  const pillInactive: React.CSSProperties = { ...pillBase, background: 'transparent', color: C.textSecondary };

  return (
    <div className='min-h-screen p-3 md:p-8'>
      <div className='max-w-[1600px] mx-auto'>

        {/* ═══ HEADER ═══ */}
        <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className='mb-8'>
          <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 8 }}>
            IPL 2026
          </p>
          <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
            <div>
              <h1 className='text-4xl md:text-5xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: C.white }}>
                MATCH CENTER
              </h1>
              <p style={{ color: C.textSecondary, marginTop: 8, fontSize: 15 }}>
                Browse upcoming fixtures, completed results, and venue context in one place.
              </p>
              {error && <p className='mt-2 text-xs' style={{ color: C.accentRed }}>Live data unavailable — showing cached data.</p>}
            </div>

            {/* Tab pills */}
            <div style={{ display: 'inline-flex', gap: 4, alignSelf: 'flex-start' }}>
              {(['all', 'upcoming', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  type='button'
                  style={activeTab === tab ? pillActive : pillInactive}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ═══ TEAM FILTER ═══ */}
        <div className='flex flex-wrap gap-2 mb-6'>
          <button
            type='button'
            style={selectedTeam === 'ALL' ? pillActive : pillInactive}
            onClick={() => router.push('/matches')}
          >
            ALL TEAMS
          </button>
          {allTeamKeys.map((team) => (
            <button
              key={team}
              type='button'
              style={selectedTeam === team
                ? { ...pillBase, background: teamInfo[team].color, color: C.white, borderColor: teamInfo[team].color, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }
                : pillInactive
              }
              onClick={() => router.push(`/matches?team=${team}`)}
            >
              {team}
            </button>
          ))}
        </div>

        {/* ═══ MAIN GRID ═══ */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8'>
          <div className='lg:col-span-2 space-y-4'>

            {/* Spotlight match */}
            {spotlightMatch && activeTab !== 'completed' && (
              <div
                className='match-card p-6 match-today'
                style={{
                  background: `linear-gradient(135deg, ${C.cardBg} 0%, rgba(212,175,55,0.06) 100%)`,
                  borderColor: `rgba(212,175,55,0.35)`,
                }}
              >
                <div className='flex items-center justify-between mb-5'>
                  <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, fontWeight: 700 }}>
                    <Zap size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    {spotlightMatch.status === 'live' || spotlightMatch.date <= today ? 'SPOTLIGHT MATCH' : 'NEXT MATCH'}
                  </p>
                  <span style={{ color: C.textSecondary, fontSize: 12 }}>{spotlightMatch.title || `Match ${spotlightMatch.matchNumber}`}</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4'>
                  <div className='flex flex-col items-center gap-2'>
                    <TeamMark team={spotlightMatch.team1} />
                    <div className='w-20 h-20 rounded-full overflow-hidden border-2' style={{ borderColor: teamInfo[spotlightMatch.team1].color, background: C.deepBg }}>
                      <img src={teamInfo[spotlightMatch.team1].captain.image} alt={teamInfo[spotlightMatch.team1].captain.name} className='w-full h-full object-cover' onError={(event) => { (event.target as HTMLImageElement).src = teamInfo[spotlightMatch.team1].captain.fallbackImage || ''; }} />
                    </div>
                  </div>

                  <div className='text-center'>
                    <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: C.gold }}>VS</p>
                    <p style={{ marginTop: 8, fontSize: 12, color: C.textSecondary }}>
                      {spotlightMatch.status === 'completed' ? getStatusLabel(spotlightMatch) : `Historical edge: ${Math.round(getHistoricalWinProbability(spotlightMatch.team1, spotlightMatch.team2))}% ${spotlightMatch.team1}`}
                    </p>
                  </div>

                  <div className='flex flex-col items-center gap-2'>
                    <TeamMark team={spotlightMatch.team2} />
                    <div className='w-20 h-20 rounded-full overflow-hidden border-2' style={{ borderColor: teamInfo[spotlightMatch.team2].color, background: C.deepBg }}>
                      <img src={teamInfo[spotlightMatch.team2].captain.image} alt={teamInfo[spotlightMatch.team2].captain.name} className='w-full h-full object-cover' onError={(event) => { (event.target as HTMLImageElement).src = teamInfo[spotlightMatch.team2].captain.fallbackImage || ''; }} />
                    </div>
                  </div>
                </div>
                <div className='flex flex-wrap gap-4 mt-5 justify-center' style={{ color: C.textSecondary, fontSize: 12 }}>
                  <span className='flex items-center gap-1'><Calendar size={12} /> {formatDate(spotlightMatch.date)}</span>
                  <span className='flex items-center gap-1'><MapPin size={12} /> {spotlightMatch.venue}</span>
                  <span className='flex items-center gap-1'><Clock size={12} /> {spotlightMatch.status === 'live' ? 'In progress' : 'Scheduled'}</span>
                </div>
              </div>
            )}

            {/* Stats card */}
            <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: 24 }}>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, fontWeight: 500, marginBottom: 4 }}>Completed</p>
                  <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: C.white }}>{completedCount}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, fontWeight: 500, marginBottom: 4 }}>Upcoming</p>
                  <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: C.white }}>{upcomingCount}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted, fontWeight: 500, marginBottom: 4 }}>Live now</p>
                  <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: filteredLiveCount > 0 ? C.liveRed : C.white }}>{filteredLiveCount}</p>
                </div>
              </div>
              {topTeam && (
                <div style={{
                  marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  borderRadius: 6, border: `1px solid ${C.cardBorder}`, background: 'rgba(212,175,55,0.05)', padding: '12px 16px',
                }}>
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 4 }}>
                      <Trophy size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      Current table leader
                    </p>
                    <p className='font-bold' style={{ color: C.white, fontSize: 16 }}>{topTeam.team}</p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 14, color: C.textSecondary }}>
                    <p><span style={{ color: C.white, fontWeight: 700 }}>{topTeam.points}</span> pts</p>
                    <p><span style={{ color: topTeam.nrr > 0 ? C.accentGreen : C.accentRed, fontWeight: 600 }}>{topTeam.nrr > 0 ? '+' : ''}{topTeam.nrr.toFixed(3)}</span> NRR</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: 24 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, fontWeight: 700, marginBottom: 16 }}>SEASON FILTER</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div>
                <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 2 }}>Selected team</p>
                <p style={{ color: C.white, fontWeight: 700 }}>{selectedTeam}</p>
              </div>
              <div>
                <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 2 }}>View mode</p>
                <p style={{ color: C.white, fontWeight: 700 }}>{activeTab}</p>
              </div>
              <div>
                <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 2 }}>Top team streak</p>
                <p style={{ color: C.white, fontWeight: 700 }}>
                  <TrendingUp size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: C.accentGreen }} />
                  {topTeam ? getWinStreak(topTeam.team, allCompleted) : 0} wins
                </p>
              </div>
            </div>
            <Link href='/analytics' className='block mt-6'>
              <button className='btn-simulate'>OPEN ANALYTICS</button>
            </Link>
          </aside>
        </div>

        {/* ═══ FIXTURES & RESULTS — Full Width ═══ */}
        <div className='space-y-10'>
          {(activeTab === 'all' || activeTab === 'upcoming') && (
            <section className='space-y-4'>
              <p style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, fontWeight: 700 }}>
                UPCOMING FIXTURES
              </p>
              {Object.keys(upcomingGroups).length > 0 ? Object.entries(upcomingGroups).map(([date, groupedMatches]) => (
                <DateSection key={date} title={formatDate(date)} matches={groupedMatches} />
              )) : <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: 24, color: C.textSecondary }}>No upcoming fixtures for this filter.</div>}
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'completed') && (
            <section className='space-y-4'>
              <p style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, fontWeight: 700 }}>
                COMPLETED RESULTS
              </p>
              {Object.keys(completedGroups).length > 0 ? Object.entries(completedGroups).map(([date, groupedMatches]) => (
                <DateSection key={date} title={formatDate(date)} matches={groupedMatches} />
              )) : <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: 24, color: C.textSecondary }}>No completed matches for this filter.</div>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
