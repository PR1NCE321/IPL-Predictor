"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronDown, Clock, Flame, MapPin, Timer } from 'lucide-react';
import { useState } from 'react';
import type { Match, Team } from '@/types';
import { getHistoricalWinProbability, teamInfo } from '@/data/mockData';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';

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

function TeamMark({ team }: { team: Team }) {
  const info = teamInfo[team];

  return (
    <div className='flex items-center gap-2'>
      <div className='w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10' style={{ background: '#11141B' }}>
        <img src={info.logo} alt={team} className='w-full h-full object-contain p-1' />
      </div>
      <div>
        <p className='font-bold text-sm team-abbr' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{team}</p>
        <p className='text-[11px]' style={{ color: '#8890A0' }}>{info.name}</p>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const team1 = teamInfo[match.team1];
  const team2 = teamInfo[match.team2];
  const isCompleted = match.status === 'completed';
  const probability = getHistoricalWinProbability(match.team1, match.team2);
  const isLive = match.status === 'live';

  return (
    <div className={`match-card p-4 md:p-5 ${isLive ? 'match-today' : ''}`}>
      <div className='flex items-start justify-between gap-4 mb-4'>
        <div>
          <p className='section-label mb-1'>Match {match.matchNumber}</p>
          <p className='text-sm font-semibold' style={{ color: '#E8E8E8' }}>{getStatusLabel(match)}</p>
        </div>
        <div className='text-right text-xs' style={{ color: '#8890A0' }}>
          <div className='flex items-center gap-1 justify-end'><Calendar size={12} /> {formatDate(match.date)}</div>
          <div className='flex items-center gap-1 justify-end mt-1'><MapPin size={12} /> {getVenueCity(match.venue)}</div>
        </div>
      </div>

      <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
        <div className='flex flex-col items-center text-center gap-2'>
          <div className='w-14 h-14 rounded-full overflow-hidden border-2' style={{ borderColor: team1.color, background: '#0D0F14' }}>
            <img src={team1.captain.image} alt={team1.captain.name} className='w-full h-full object-cover' onError={(event) => { (event.target as HTMLImageElement).src = team1.captain.fallbackImage || ''; }} />
          </div>
          <TeamMark team={match.team1} />
        </div>

        <div className='px-2 text-center'>
          <p className='vs-text text-xl md:text-2xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#3D4356' }}>VS</p>
          {isCompleted ? (
            <p className='mt-2 text-[11px]' style={{ color: '#8890A0' }}>
              Winner: <span style={{ color: '#D4AF37', fontWeight: 700 }}>{match.winner}</span>
            </p>
          ) : (
            <p className='mt-2 text-[11px]' style={{ color: '#8890A0' }}>
              H2H edge: <span style={{ color: '#D4AF37', fontWeight: 700 }}>{Math.round(probability)}%</span> {match.team1}
            </p>
          )}
        </div>

        <div className='flex flex-col items-center text-center gap-2'>
          <div className='w-14 h-14 rounded-full overflow-hidden border-2' style={{ borderColor: team2.color, background: '#0D0F14' }}>
            <img src={team2.captain.image} alt={team2.captain.name} className='w-full h-full object-cover' onError={(event) => { (event.target as HTMLImageElement).src = team2.captain.fallbackImage || ''; }} />
          </div>
          <TeamMark team={match.team2} />
        </div>
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-3 text-xs' style={{ color: '#8890A0' }}>
        <span className='flex items-center gap-1'><Timer size={12} /> {match.status === 'live' ? 'In progress' : 'Scheduled'}</span>
        <span className='flex items-center gap-1'><Flame size={12} /> {getVenueColor(match.venue) !== '#8890A0' ? `Venue form: ${getVenueCity(match.venue)}` : 'Neutral venue'}</span>
      </div>
    </div>
  );
}

function DateSection({ title, matches }: { title: string; matches: Match[] }) {
  if (matches.length === 0) return null;

  return (
    <section className='space-y-3'>
      <div className='flex items-center justify-between'>
        <p className='section-label'>{title}</p>
        <ChevronDown size={14} style={{ color: '#3D4356' }} />
      </div>
      <div className='space-y-3'>
        {matches.map((match) => <MatchCard key={match.id} match={match} />)}
      </div>
    </section>
  );
}

export default function MatchesClient() {
  const { matches, pointsTable, loading, error } = useLiveSystemData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamParam = searchParams.get('team');
  const selectedTeam = teamParam && teamParam in teamInfo ? (teamParam as Team) : 'ALL';
  const [activeTab, setActiveTab] = useState<TabType>('all');

  if (loading || !matches) {
    return (
      <div className='min-h-screen p-8'>
        <div className='max-w-6xl mx-auto space-y-3'>
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className='skeleton h-20 w-full' />)}
        </div>
      </div>
    );
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

  const spotlightMatch = filteredMatches.upcoming.find((match) => match.status === 'live' || match.date === today) || filteredMatches.upcoming[0] || null;
  const remainingUpcoming = spotlightMatch ? filteredMatches.upcoming.filter((match) => match.id !== spotlightMatch.id) : filteredMatches.upcoming;
  const upcomingGroups = groupByDate(remainingUpcoming);
  const completedGroups = groupByDate(filteredMatches.completed);
  const topTeam = pointsTable?.[0] ?? null;
  const filteredLiveCount = filteredMatches.upcoming.filter((match) => match.status === 'live').length;
  const completedCount = filteredMatches.completed.length;
  const upcomingCount = filteredMatches.upcoming.length;
  const allTeamKeys = Object.keys(teamInfo) as Team[];

  return (
    <div className='min-h-screen p-6 md:p-8'>
      <div className='max-w-6xl mx-auto'>
        <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className='mb-8'>
          <p className='section-label mb-2'>IPL 2026</p>
          <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
            <div>
              <h1 className='text-4xl md:text-5xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>
                MATCH CENTER
              </h1>
              <p style={{ color: '#8890A0', marginTop: 8, fontSize: 15 }}>
                Browse upcoming fixtures, completed results, and venue context in one place.
              </p>
              {error && <p className='mt-2 text-xs' style={{ color: '#E8003D' }}>Live data unavailable — showing cached data.</p>}
            </div>

            <div className='pill-toggle self-start'>
              {(['all', 'upcoming', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  type='button'
                  className={`pill-toggle-item ${activeTab === tab ? 'active' : ''}`}
                  style={activeTab === tab ? { background: '#D4AF37', color: '#0D0F14' } : undefined}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className='flex flex-wrap gap-2 mb-6'>
          <button type='button' className='pill-toggle-item active' style={selectedTeam === 'ALL' ? { background: '#D4AF37', color: '#0D0F14' } : undefined} onClick={() => router.push('/matches')}>
            ALL TEAMS
          </button>
          {allTeamKeys.map((team) => (
            <button
              key={team}
              type='button'
              className='pill-toggle-item'
              style={selectedTeam === team ? { background: teamInfo[team].color, color: '#0D0F14' } : undefined}
              onClick={() => router.push(`/matches?team=${team}`)}
            >
              {team}
            </button>
          ))}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8'>
          <div className='lg:col-span-2 space-y-4'>
            {spotlightMatch && (
              <div className='match-card p-6 match-today'>
                <div className='flex items-center justify-between mb-5'>
                  <p className='section-label'>{spotlightMatch.status === 'live' || spotlightMatch.date === today ? 'SPOTLIGHT MATCH' : 'NEXT MATCH'}</p>
                  <span style={{ color: '#8890A0', fontSize: 12 }}>Match {spotlightMatch.matchNumber}</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4'>
                  <div className='flex flex-col items-center gap-2'>
                    <TeamMark team={spotlightMatch.team1} />
                    <div className='w-20 h-20 rounded-full overflow-hidden border-2' style={{ borderColor: teamInfo[spotlightMatch.team1].color, background: '#0D0F14' }}>
                      <img src={teamInfo[spotlightMatch.team1].captain.image} alt={teamInfo[spotlightMatch.team1].captain.name} className='w-full h-full object-cover' onError={(event) => { (event.target as HTMLImageElement).src = teamInfo[spotlightMatch.team1].captain.fallbackImage || ''; }} />
                    </div>
                  </div>

                  <div className='text-center'>
                    <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#D4AF37' }}>VS</p>
                    <p className='mt-2 text-xs' style={{ color: '#8890A0' }}>
                      {spotlightMatch.status === 'completed' ? getStatusLabel(spotlightMatch) : `Historical edge: ${Math.round(getHistoricalWinProbability(spotlightMatch.team1, spotlightMatch.team2))}% ${spotlightMatch.team1}`}
                    </p>
                  </div>

                  <div className='flex flex-col items-center gap-2'>
                    <TeamMark team={spotlightMatch.team2} />
                    <div className='w-20 h-20 rounded-full overflow-hidden border-2' style={{ borderColor: teamInfo[spotlightMatch.team2].color, background: '#0D0F14' }}>
                      <img src={teamInfo[spotlightMatch.team2].captain.image} alt={teamInfo[spotlightMatch.team2].captain.name} className='w-full h-full object-cover' onError={(event) => { (event.target as HTMLImageElement).src = teamInfo[spotlightMatch.team2].captain.fallbackImage || ''; }} />
                    </div>
                  </div>
                </div>
                <div className='flex flex-wrap gap-3 mt-5 justify-center' style={{ color: '#8890A0', fontSize: 12 }}>
                  <span className='flex items-center gap-1'><Calendar size={12} /> {formatDate(spotlightMatch.date)}</span>
                  <span className='flex items-center gap-1'><MapPin size={12} /> {spotlightMatch.venue}</span>
                  <span className='flex items-center gap-1'><Clock size={12} /> {spotlightMatch.status === 'live' ? 'In progress' : 'Scheduled'}</span>
                </div>
              </div>
            )}

            <div className='surface-card p-6'>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div>
                  <p className='section-label mb-1'>Completed</p>
                  <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{completedCount}</p>
                </div>
                <div>
                  <p className='section-label mb-1'>Upcoming</p>
                  <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{upcomingCount}</p>
                </div>
                <div>
                  <p className='section-label mb-1'>Live now</p>
                  <p className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{filteredLiveCount}</p>
                </div>
              </div>
              {topTeam && (
                <div className='mt-5 flex items-center justify-between gap-4 rounded-md border border-white/5 bg-black/20 px-4 py-3'>
                  <div>
                    <p className='section-label mb-1'>Current table leader</p>
                    <p className='font-bold' style={{ color: '#E8E8E8' }}>{topTeam.team}</p>
                  </div>
                  <div className='text-right text-sm' style={{ color: '#8890A0' }}>
                    <p>{topTeam.points} pts</p>
                    <p>{topTeam.nrr > 0 ? '+' : ''}{topTeam.nrr.toFixed(3)} NRR</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className='surface-card p-6'>
            <p className='section-label mb-4'>SEASON FILTER</p>
            <div className='space-y-3 text-sm'>
              <p style={{ color: '#8890A0' }}>Selected team</p>
              <p className='font-bold' style={{ color: '#E8E8E8' }}>{selectedTeam}</p>
              <p style={{ color: '#8890A0' }}>View mode</p>
              <p className='font-bold' style={{ color: '#E8E8E8' }}>{activeTab}</p>
              <p style={{ color: '#8890A0' }}>Top team streak</p>
              <p className='font-bold' style={{ color: '#E8E8E8' }}>{topTeam ? getWinStreak(topTeam.team, allCompleted) : 0} wins</p>
            </div>
            <Link href='/analytics' className='block mt-6'>
              <button className='btn-simulate'>OPEN ANALYTICS</button>
            </Link>
          </aside>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='space-y-6'>
            {(activeTab === 'all' || activeTab === 'upcoming') && (
              <>
                <p className='section-label'>UPCOMING FIXTURES</p>
                {Object.keys(upcomingGroups).length > 0 ? Object.entries(upcomingGroups).map(([date, groupedMatches]) => (
                  <DateSection key={date} title={formatDate(date)} matches={groupedMatches} />
                )) : <div className='surface-card p-6' style={{ color: '#8890A0' }}>No upcoming fixtures for this filter.</div>}
              </>
            )}
          </div>

          <div className='space-y-6'>
            {(activeTab === 'all' || activeTab === 'completed') && (
              <>
                <p className='section-label'>COMPLETED RESULTS</p>
                {Object.keys(completedGroups).length > 0 ? Object.entries(completedGroups).map(([date, groupedMatches]) => (
                  <DateSection key={date} title={formatDate(date)} matches={groupedMatches} />
                )) : <div className='surface-card p-6' style={{ color: '#8890A0' }}>No completed matches for this filter.</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
