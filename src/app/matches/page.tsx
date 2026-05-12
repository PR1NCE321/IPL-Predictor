import dynamic from 'next/dynamic';

const MatchesClient = dynamic(() => import('./MatchesClient'), { ssr: false });

export default function Page() {
  return <MatchesClient />;
}
                  <span style={{ color: '#3D4356', fontSize: 11, fontWeight: 700 }}>M{nextMatch.matchNumber}</span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                {/* Team 1 Captain */}
                <div className='flex flex-col items-center gap-2 flex-1'>
                  <div className='w-20 h-20 rounded-full overflow-hidden border-2' style={{ borderColor: t1.color, background: '#0D0F14' }}>
                    <img src={t1.captain?.image} alt={t1.captain?.name} className='w-full h-full object-cover'
                      onError={(e) => { (e.target as HTMLImageElement).src = t1.captain?.fallbackImage || ''; }} />
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-7 h-7 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 2 }}>
                      <img src={t1.logo} alt={t1.shortName} className='w-full h-full object-contain' />
                    </div>
                    <span className='font-bold text-xl' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{t1.shortName}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#8890A0' }}>{t1.captain?.name}</span>
                </div>

                {/* VS + Probability */}
                <div className='flex flex-col items-center gap-3 px-6'>
                  <span className='text-3xl font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#1E2028' }}>VS</span>
                  <div className='flex items-center gap-1' style={{ fontSize: 11, color: '#3D4356' }}>
                    <Calendar size={11} /> {formatDate(nextMatch.date)}
                  </div>
                </div>

                {/* Team 2 Captain */}
                <div className='flex flex-col items-center gap-2 flex-1'>
                  <div className='w-20 h-20 rounded-full overflow-hidden border-2' style={{ borderColor: t2.color, background: '#0D0F14' }}>
                    <img src={t2.captain?.image} alt={t2.captain?.name} className='w-full h-full object-cover'
                      onError={(e) => { (e.target as HTMLImageElement).src = t2.captain?.fallbackImage || ''; }} />
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='font-bold text-xl' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{t2.shortName}</span>
                    <div className='w-7 h-7 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 2 }}>
                      <img src={t2.logo} alt={t2.shortName} className='w-full h-full object-contain' />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#8890A0' }}>{t2.captain?.name}</span>
                </div>
              </div>

              {/* H2H Bar */}
              <div className='mt-5 pt-4' style={{ borderTop: '1px solid #1E2028' }}>
                <div className='flex justify-between mb-1'>
                  <span style={{ fontSize: 12, color: '#E8E8E8', fontWeight: 700 }}>{t1Prob}%</span>
                  <span className='section-label'>ALL-TIME H2H WIN RATE</span>
                  <span style={{ fontSize: 12, color: '#E8E8E8', fontWeight: 700 }}>{t2Prob}%</span>
                </div>
                <div className='tug-bar' style={{ height: 8 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${t1Prob}%` }} transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    style={{ background: t1.color, borderRadius: '4px 0 0 4px' }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${t2Prob}%` }} transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    style={{ background: t2.color, borderRadius: '0 4px 4px 0' }} />
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ══════ SPLIT LAYOUT ══════ */}
        {activeTab === 'all' ? (() => {
          // Limit to 5 matches each in split view
          const previewUpcoming = upcomingWithoutSpotlight.slice(0, 5);
          const previewCompleted = completed.slice(0, 5);
          const previewUpcomingGroups = groupByDate(previewUpcoming);
          const previewCompletedGroups = groupByDate(previewCompleted);

          return (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* LEFT: Upcoming */}
            <div>
              <p className='section-label mb-3'>UPCOMING — {upcomingWithoutSpotlight.length} MORE</p>
              <div className='space-y-1'>
                {Object.entries(previewUpcomingGroups).map(([date, group]) => (
                  <div key={`g-${date}`}>
                    <div className='py-2 px-3 mb-1 rounded' style={{ borderBottom: '1px solid #1E2028' }}>
                      <span className='text-xs font-bold' style={{ color: '#D4AF37', letterSpacing: '0.08em' }}>{formatDate(date)}</span>
                    </div>
                    <div className={group.length > 1 ? 'grid grid-cols-2 gap-2' : ''}>
                      {group.map((m, idx) => <UpcomingCard key={m.id} match={m} idx={idx} today={today} pointsTable={pointsTable || []} completedMatches={allCompleted} />)}
                    </div>
                  </div>
                ))}
                {upcomingWithoutSpotlight.length === 0 && <EmptyState text="No more upcoming matches." />}
              </div>
              {upcomingWithoutSpotlight.length > 5 && (
                <button onClick={() => setActiveTab('upcoming')}
                  className='w-full mt-3 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all hover:brightness-125'
                  style={{ background: 'rgba(212,175,55,0.06)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.15)' }}>
                  VIEW ALL {upcomingWithoutSpotlight.length} UPCOMING →
                </button>
              )}
            </div>

            {/* RIGHT: Completed */}
            <div>
              <p className='section-label mb-3'>RESULTS — {completed.length} MATCHES</p>
              <div className='space-y-1'>
                {Object.entries(previewCompletedGroups).map(([date, group]) => (
                  <div key={date}>
                    <div className='py-2 px-3 mb-1 rounded' style={{ borderBottom: '1px solid #1E2028' }}>
                      <span className='text-xs font-bold' style={{ color: '#8890A0', letterSpacing: '0.08em' }}>{formatDate(date)}</span>
                    </div>
                    {group.map((m, idx) => <CompletedRow key={m.id} match={m} allCompleted={allCompleted} idx={idx} />)}
                  </div>
                ))}
                {completed.length === 0 && <EmptyState text="No completed matches." />}
              </div>
              {completed.length > 5 && (
                <button onClick={() => setActiveTab('completed')}
                  className='w-full mt-3 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all hover:brightness-125'
                  style={{ background: 'rgba(136,144,160,0.06)', color: '#8890A0', border: '1px solid rgba(136,144,160,0.15)' }}>
                  VIEW ALL {completed.length} RESULTS →
                </button>
              )}
            </div>
          </div>
          );
        })() : activeTab === 'upcoming' ? (
          <div>
            <p className='section-label mb-3'>UPCOMING — {upcomingWithoutSpotlight.length} MORE</p>
            <div className='space-y-1'>
              {Object.entries(upcomingGroups).map(([date, group]) => (
                <div key={`ug-${date}`}>
                  <div className='py-2 px-3 mb-1 rounded' style={{ borderBottom: '1px solid #1E2028' }}>
                    <span className='text-xs font-bold' style={{ color: '#D4AF37', letterSpacing: '0.08em' }}>{formatDate(date)}</span>
                  </div>
                  <div className={group.length > 1 ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : ''}>
                    {group.map((m, idx) => <UpcomingCard key={m.id} match={m} idx={idx} today={today} pointsTable={pointsTable || []} completedMatches={allCompleted} />)}
                  </div>
                </div>
              ))}
              {upcomingWithoutSpotlight.length === 0 && <EmptyState text="No more upcoming matches." />}
            </div>
          </div>
        ) : (
          <div>
            <p className='section-label mb-3'>RESULTS — {completed.length} MATCHES</p>
            <div className='space-y-1'>
              {Object.entries(completedGroups).map(([date, group]) => (
                <div key={date}>
                  <div className='py-2 px-3 mb-1 rounded' style={{ background: '#0D0F14', borderBottom: '1px solid #1E2028' }}>
                    <span className='text-xs font-bold' style={{ color: '#8890A0', letterSpacing: '0.08em' }}>{formatDate(date)}</span>
                  </div>
                  {group.map((m, idx) => <CompletedRow key={m.id} match={m} allCompleted={allCompleted} idx={idx} />)}
                </div>
              ))}
              {completed.length === 0 && <EmptyState text="No completed matches." />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── UPCOMING CARD ───
function UpcomingCard({ match: m, idx, today, pointsTable, completedMatches }: {
  match: any; idx: number; today: string; pointsTable: any[]; completedMatches: any[];
}) {
  const t1 = teamInfo[m.team1 as Team];
  const t2 = teamInfo[m.team2 as Team];
  const isToday = m.date === today;
  const t1Prob = getHistoricalWinProbability(m.team1, m.team2);
  const t2Prob = 100 - t1Prob;
  const venueCity = getVenueCity(m.venue);
  const venueColor = getVenueColor(m.venue);

  // Team standings
  const t1Entry = pointsTable.find((e: any) => e.team === m.team1);
  const t2Entry = pointsTable.find((e: any) => e.team === m.team2);
  const t1Rank = pointsTable.findIndex((e: any) => e.team === m.team1) + 1;
  const t2Rank = pointsTable.findIndex((e: any) => e.team === m.team2) + 1;

  // Form guide (last 5 results)
  const getForm = (team: string) => {
    return completedMatches
      .filter((cm: any) => cm.team1 === team || cm.team2 === team)
      .slice(-5)
      .map((cm: any) => cm.winner === team ? 'W' : cm.winner ? 'L' : 'NR');
  };
  const t1Form = getForm(m.team1);
  const t2Form = getForm(m.team2);

  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: idx * 0.03 }}
      className={`match-card p-4 mb-2 ${isToday ? 'match-today' : ''}`}
    >
      {/* Top bar: match info + venue */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          {isToday && <span className='live-badge' style={{ fontSize: 9, padding: '2px 6px' }}><span className='live-dot' /> TODAY</span>}
          <span style={{ color: '#3D4356', fontSize: 10, fontWeight: 700 }}>M{m.matchNumber}</span>
          <span style={{ color: '#3D4356', fontSize: 9 }}>•</span>
          <span style={{ color: '#3D4356', fontSize: 9 }}>{formatDate(m.date)}</span>
        </div>
        <span className='px-2 py-0.5 rounded text-xs' style={{ background: `${venueColor}12`, color: venueColor, fontSize: 9, fontWeight: 600, border: `1px solid ${venueColor}25` }}>
          {venueCity}
        </span>
      </div>

      {/* Main matchup */}
      <div className='flex items-stretch justify-between gap-2'>
        {/* Team 1 */}
        <div className='flex-1 flex flex-col items-center gap-1'>
          <div className='w-10 h-10 rounded-full overflow-hidden border-2' style={{ borderColor: t1.color, background: '#0D0F14' }}>
            <img src={t1.captain?.image} alt={t1.captain?.name} className='w-full h-full object-cover'
              onError={(e) => { (e.target as HTMLImageElement).src = t1.captain?.fallbackImage || ''; }} />
          </div>
          <div className='flex items-center gap-1'>
            <div className='w-4 h-4 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 1 }}>
              <img src={t1.logo} alt={t1.shortName} className='w-full h-full object-contain' />
            </div>
            <span className='font-bold text-sm' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{t1.shortName}</span>
          </div>
          {/* Rank + Record */}
          <div className='flex items-center gap-1'>
            <span style={{ fontSize: 9, color: '#D4AF37', fontWeight: 700 }}>#{t1Rank}</span>
            {t1Entry && <span style={{ fontSize: 9, color: '#3D4356' }}>{t1Entry.wins}W-{t1Entry.losses}L</span>}
          </div>
          {/* Form dots */}
          <div className='flex gap-1'>
            {t1Form.map((r: string, i: number) => (
              <div key={i} className='w-2 h-2 rounded-full' style={{
                background: r === 'W' ? '#1D9E75' : r === 'L' ? '#E8003D' : '#3D4356'
              }} />
            ))}
          </div>
        </div>

        {/* VS */}
        <div className='flex flex-col items-center justify-center px-2'>
          <span className='text-lg font-bold' style={{ fontFamily: 'var(--font-barlow)', color: '#1E2028' }}>VS</span>
        </div>

        {/* Team 2 */}
        <div className='flex-1 flex flex-col items-center gap-1'>
          <div className='w-10 h-10 rounded-full overflow-hidden border-2' style={{ borderColor: t2.color, background: '#0D0F14' }}>
            <img src={t2.captain?.image} alt={t2.captain?.name} className='w-full h-full object-cover'
              onError={(e) => { (e.target as HTMLImageElement).src = t2.captain?.fallbackImage || ''; }} />
          </div>
          <div className='flex items-center gap-1'>
            <span className='font-bold text-sm' style={{ fontFamily: 'var(--font-barlow)', color: '#E8E8E8' }}>{t2.shortName}</span>
            <div className='w-4 h-4 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 1 }}>
              <img src={t2.logo} alt={t2.shortName} className='w-full h-full object-contain' />
            </div>
          </div>
          {/* Rank + Record */}
          <div className='flex items-center gap-1'>
            <span style={{ fontSize: 9, color: '#D4AF37', fontWeight: 700 }}>#{t2Rank}</span>
            {t2Entry && <span style={{ fontSize: 9, color: '#3D4356' }}>{t2Entry.wins}W-{t2Entry.losses}L</span>}
          </div>
          {/* Form dots */}
          <div className='flex gap-1'>
            {t2Form.map((r: string, i: number) => (
              <div key={i} className='w-2 h-2 rounded-full' style={{
                background: r === 'W' ? '#1D9E75' : r === 'L' ? '#E8003D' : '#3D4356'
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* H2H Bar */}
      <div className='mt-3 pt-2' style={{ borderTop: '1px solid #1E2028' }}>
        <div className='flex justify-between mb-1'>
          <span style={{ fontSize: 9, color: '#8890A0' }}>{t1Prob}%</span>
          <span style={{ fontSize: 8, color: '#3D4356', letterSpacing: '0.1em', textTransform: 'uppercase' }}>H2H WIN RATE</span>
          <span style={{ fontSize: 9, color: '#8890A0' }}>{t2Prob}%</span>
        </div>
        <div className='tug-bar' style={{ height: 4 }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${t1Prob}%` }} transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ background: t1.color, borderRadius: '3px 0 0 3px' }} />
          <motion.div initial={{ width: 0 }} animate={{ width: `${t2Prob}%` }} transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ background: t2.color, borderRadius: '0 3px 3px 0' }} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── COMPLETED SCORECARD ───
function CompletedRow({ match: m, allCompleted, idx }: { match: any; allCompleted: any[]; idx: number }) {
  const t1 = teamInfo[m.team1 as Team];
  const t2 = teamInfo[m.team2 as Team];
  const isT1Win = m.winner === m.team1;
  const isT2Win = m.winner === m.team2;
  const noResult = !m.winner;
  const winnerTeam = m.winner ? teamInfo[m.winner as Team] : null;

  // Win streak badge
  const winnerStreak = m.winner ? getWinStreak(m.winner, allCompleted) : 0;
  const venueCity = getVenueCity(m.venue);
  const venueColor = getVenueColor(m.venue);

  const StreakBadge = winnerStreak >= 3 ? (
    <span className='flex items-center gap-0.5 px-1.5 py-0.5 rounded' style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
      <Flame size={9} style={{ color: '#D4AF37' }} />
      <span style={{ fontSize: 8, color: '#D4AF37', fontWeight: 700 }}>{winnerStreak}W</span>
    </span>
  ) : null;

  return (
    <motion.div
      initial={{ y: 4, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(idx * 0.015, 0.2) }}
      className='match-card p-4 mb-2'
      style={{ borderLeft: winnerTeam ? `3px solid ${winnerTeam.color}` : '3px solid #3D4356' }}
    >
      {/* Matchup Row */}
      <div className='flex items-center justify-between gap-2'>
        {/* Team 1 */}
        <div className='flex items-center gap-2 flex-1'>
          <div className='relative'>
            <div className='w-9 h-9 rounded-full overflow-hidden border' style={{
              borderColor: isT1Win ? '#D4AF37' : '#1E2028',
              background: '#0D0F14',
              opacity: isT2Win ? 0.4 : 1,
            }}>
              <img src={t1.captain?.image} alt={t1.captain?.name} className='w-full h-full object-cover'
                onError={(e) => { (e.target as HTMLImageElement).src = t1.captain?.fallbackImage || ''; }} />
            </div>
          </div>
          <div className='flex flex-col'>
            {isT1Win && StreakBadge}
            <div className='flex items-center gap-1'>
              <div className='w-4 h-4 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 1, opacity: isT2Win ? 0.4 : 1 }}>
                <img src={t1.logo} alt={m.team1} className='w-full h-full object-contain' />
              </div>
              <span className='font-bold' style={{
                fontFamily: 'var(--font-barlow)', fontSize: 14,
                color: isT1Win ? '#D4AF37' : isT2Win ? '#3D4356' : '#8890A0'
              }}>{m.team1}</span>
              {isT1Win && <span style={{ fontSize: 9, color: '#1D9E75' }}>✓</span>}
            </div>
          </div>
        </div>

        {/* Center: Match Info + Result */}
        <div className='flex flex-col items-center px-3 shrink-0'>
          <span style={{ color: '#3D4356', fontSize: 9, fontWeight: 700 }}>M{m.matchNumber}</span>
          {noResult ? (
            <span className='px-2 py-0.5 rounded text-xs font-bold mt-1' style={{ background: 'rgba(136,144,160,0.08)', color: '#8890A0' }}>NO RESULT</span>
          ) : (
            <span className='text-xs font-bold mt-0.5' style={{ color: '#1D9E75' }}>
              +{m.margin} {m.marginType === 'runs' ? 'RUNS' : 'WKTS'}
            </span>
          )}
          <span className='px-1.5 py-0.5 rounded mt-0.5' style={{ fontSize: 7, background: `${venueColor}10`, color: venueColor, fontWeight: 600 }}>
            {venueCity}
          </span>
        </div>

        {/* Team 2 */}
        <div className='flex items-center gap-2 flex-1 justify-end'>
          <div className='flex flex-col items-end'>
            {isT2Win && StreakBadge}
            <div className='flex items-center gap-1'>
              {isT2Win && <span style={{ fontSize: 9, color: '#1D9E75' }}>✓</span>}
              <span className='font-bold' style={{
                fontFamily: 'var(--font-barlow)', fontSize: 14,
                color: isT2Win ? '#D4AF37' : isT1Win ? '#3D4356' : '#8890A0'
              }}>{m.team2}</span>
              <div className='w-4 h-4 rounded overflow-hidden shrink-0' style={{ background: '#1A1D26', padding: 1, opacity: isT1Win ? 0.4 : 1 }}>
                <img src={t2.logo} alt={m.team2} className='w-full h-full object-contain' />
              </div>
            </div>
          </div>
          <div className='relative'>
            <div className='w-9 h-9 rounded-full overflow-hidden border' style={{
              borderColor: isT2Win ? '#D4AF37' : '#1E2028',
              background: '#0D0F14',
              opacity: isT1Win ? 0.4 : 1,
            }}>
              <img src={t2.captain?.image} alt={t2.captain?.name} className='w-full h-full object-cover'
                onError={(e) => { (e.target as HTMLImageElement).src = t2.captain?.fallbackImage || ''; }} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className='surface-card p-6 text-center' style={{ color: '#3D4356', fontSize: 13 }}>{text}</div>
  );
}
