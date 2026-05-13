'use client';

import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useEffect, useMemo, useRef } from 'react';
import { teamInfo } from '@/data/mockData';
import { CheckCircle2, Activity, Shield, XCircle, Trophy, TrendingUp, BarChart3, Zap, Cpu, Target, Flame } from 'lucide-react';
import { useLiveSystemData } from '@/hooks/useLiveSystemData';
import { useCountUp } from '@/hooks/useCountUp';
import type { Match, Team, PointsTableEntry } from '@/types';

const C = {
  white: '#FFFFFF', textPrimary: '#F0F2F5', textSecondary: '#C5CBD6',
  textMuted: '#9AA2B5', gold: '#D4AF37', green: '#34D399', red: '#F87171',
  deepGreen: '#1D9E75', deepRed: '#E8003D', cardBg: '#131620',
  cardBorder: '#1F2233', deepBg: '#0D0F14', elevated: '#1A1D26',
  goldGlow: 'rgba(212,175,55,0.15)', greenGlow: 'rgba(29,158,117,0.15)',
  redGlow: 'rgba(232,0,61,0.1)',
};

/* ── Animated number ── */
function AnimatedPercent({ value }: { value: number }) {
  const v = useCountUp(value, 800, 1);
  return <>{v}%</>;
}

/* ── Radial progress ring ── */
function RadialProgress({ value, size = 56, strokeWidth = 4, color }: { value: number; size?: number; strokeWidth?: number; color: string }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.elevated} strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
    </svg>
  );
}

/* ── Particle burst on Q/E status ── */
function ParticleBurst({ color }: { color: string }) {
  return (
    <motion.div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div key={i}
          style={{ position: 'absolute', top: '50%', left: '50%', width: 3, height: 3, borderRadius: '50%', background: color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((i / 6) * 2 * Math.PI) * 20,
            y: Math.sin((i / 6) * 2 * Math.PI) * 20,
            opacity: 0, scale: 0,
          }}
          transition={{ duration: 0.6, delay: 0.8 + i * 0.05 }}
        />
      ))}
    </motion.div>
  );
}

type TeamStatus = 'Q' | 'E' | 'ALIVE';

function getTeamStatus(chance: number): TeamStatus {
  if (chance >= 99.5) return 'Q';
  if (chance <= 0.5) return 'E';
  return 'ALIVE';
}

function StatusBadge({ status, animate }: { status: TeamStatus; animate?: boolean }) {
  if (status === 'Q') return (
    <motion.span
      initial={animate ? { scale: 0, rotate: -20 } : undefined}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.8 }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: 4, fontSize: 11, fontWeight: 800,
        background: 'rgba(29,158,117,0.2)', color: C.deepGreen,
        border: '1px solid rgba(29,158,117,0.4)',
        boxShadow: '0 0 10px rgba(29,158,117,0.4), inset 0 0 6px rgba(29,158,117,0.1)',
        letterSpacing: '0.05em',
      }}
    >Q</motion.span>
  );
  if (status === 'E') return (
    <motion.span
      initial={animate ? { scale: 0, rotate: 20 } : undefined}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.8 }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: 4, fontSize: 11, fontWeight: 800,
        background: 'rgba(232,0,61,0.15)', color: C.deepRed,
        border: '1px solid rgba(232,0,61,0.3)',
        boxShadow: '0 0 10px rgba(232,0,61,0.25), inset 0 0 4px rgba(232,0,61,0.08)',
        letterSpacing: '0.05em',
      }}
    >E</motion.span>
  );
  return null;
}

/* ── Scanning line overlay for simulation state ── */
function ScanLineOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 8,
        background: 'linear-gradient(to bottom, transparent 0%, rgba(212,175,55,0.03) 50%, transparent 100%)',
      }}
    >
      <motion.div
        style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}

/* ── Glowing dot pulse ── */
function PulseDot({ color }: { color: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.span
        animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: color, opacity: 0.4 }}
      />
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
    </span>
  );
}

/* ── Hero stat card ── */
function HeroStat({ icon, label, value, sub, color, delay, glow }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub: string; color: string; delay: number; glow: string;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ y: -3, boxShadow: `0 12px 40px ${glow}` }}
      style={{
        background: C.cardBg, borderRadius: 10, padding: '20px 24px',
        border: `1px solid ${C.cardBorder}`,
        borderTop: `1px solid ${color}33`,
        boxShadow: `0 0 0 transparent`,
        transition: 'box-shadow 0.3s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Corner accent */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRadius: '0 10px 0 60px', background: `${color}0a` }} />
      <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {label}
      </p>
      <p style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-barlow)', color, lineHeight: 1 }}>{value}</p>
      <p style={{ color: C.textSecondary, fontSize: 12, marginTop: 6 }}>{sub}</p>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { matches, pointsTable: sortedTable, loading, error } = useLiveSystemData();
  const [mcProbabilities, setMcProbabilities] = useState<Record<string, number>>({});
  const [isSimulating, setIsSimulating] = useState(true);
  const [simProgress, setSimProgress] = useState(0);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    if (!matches || !sortedTable) return;
    const pendingMatches = matches.filter(m => m.status === 'pending');
    if (pendingMatches.length === 0) {
      const finalProbs: Record<string, number> = {};
      sortedTable.forEach((t, idx) => finalProbs[t.team] = idx < 4 ? 100 : 0);
      setMcProbabilities(finalProbs);
      setIsSimulating(false);
      return;
    }
    setIsSimulating(true);
    setSimProgress(0);

    // Animate progress bar during sim
    let prog = 0;
    const interval = setInterval(() => {
      prog = Math.min(prog + 8, 92);
      setSimProgress(prog);
    }, 10);

    setTimeout(() => {
      clearInterval(interval);
      setSimProgress(100);
      const NUM_SIMS = 10000;
      const qualifyCount: Record<string, number> = {};
      sortedTable.forEach(t => qualifyCount[t.team] = 0);
      for (let i = 0; i < NUM_SIMS; i++) {
        const simPoints: Record<string, number> = {};
        sortedTable.forEach(t => simPoints[t.team] = t.points);
        for (const m of pendingMatches) {
          const winner = Math.random() > 0.5 ? m.team1 : m.team2;
          simPoints[winner] += 2;
        }
        const simTable = sortedTable.map(t => ({ team: t.team, pts: simPoints[t.team], nrr: t.nrr }))
          .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.nrr - a.nrr);
        for (let j = 0; j < 4; j++) qualifyCount[simTable[j].team] += 1;
      }
      const finalProbs: Record<string, number> = {};
      for (const team in qualifyCount) finalProbs[team] = (qualifyCount[team] / NUM_SIMS) * 100;
      setMcProbabilities(finalProbs);
      setIsSimulating(false);
    }, 100);
  }, [matches, sortedTable]);

  const maxPossiblePoints = useMemo(() => {
    if (!matches || !sortedTable) return {} as Record<string, number>;
    const result: Record<string, number> = {};
    sortedTable.forEach(t => {
      const remaining = matches.filter(m => m.status === 'pending' && (m.team1 === t.team || m.team2 === t.team)).length;
      result[t.team] = t.points + remaining * 2;
    });
    return result;
  }, [matches, sortedTable]);

  if (loading || !sortedTable) {
    return (
      <div className='min-h-screen p-8'>
        <div className='max-w-5xl mx-auto space-y-3'>
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className='skeleton h-14 w-full' />)}
        </div>
      </div>
    );
  }

  const completed = matches?.filter(m => m.status === 'completed').length || 0;
  const pending = matches?.filter(m => m.status === 'pending').length || 0;
  const totalMatches = matches?.length || 70;
  const completionPct = Math.round((completed / totalMatches) * 100);

  const qualifiedCount = sortedTable.filter(t => getTeamStatus(mcProbabilities[t.team] || 0) === 'Q').length;
  const eliminatedCount = sortedTable.filter(t => getTeamStatus(mcProbabilities[t.team] || 0) === 'E').length;
  const aliveCount = sortedTable.length - qualifiedCount - eliminatedCount;

  return (
    <div className='min-h-screen p-6 md:p-8' style={{ position: 'relative' }}>
      {/* Background grid pattern */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(212,175,55,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212,175,55,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      <div className='max-w-[1400px] mx-auto' style={{ position: 'relative', zIndex: 1 }}>

        {/* ── HEADER ── */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className='mb-8'
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <motion.div
                  style={{ width: 3, height: 32, background: `linear-gradient(to bottom, ${C.gold}, transparent)`, borderRadius: 2 }}
                  initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3, duration: 0.4 }}
                />
                <div>
                  <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>IPL 2026</p>
                  <h1 className='text-4xl md:text-5xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: C.white, lineHeight: 1 }}>
                    ANALYTICS DASHBOARD
                  </h1>
                </div>
              </div>
              <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 6 }}>
                {completed} of {totalMatches} matches completed · {pending} remaining
              </p>
            </div>

            {/* Simulation status pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                background: C.cardBg, border: `1px solid ${C.cardBorder}`,
                borderRadius: 8, padding: '12px 16px', minWidth: 220,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {isSimulating ? (
                  <>
                    <PulseDot color={C.gold} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Simulating
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} color={C.deepGreen} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.deepGreen, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Computed
                    </span>
                  </>
                )}
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: C.elevated, borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 2, background: isSimulating ? C.gold : C.deepGreen }}
                  animate={{ width: `${isSimulating ? simProgress : 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>
                {isSimulating ? 'Running 10,000 Monte Carlo iterations...' : '10,000 simulations complete'}
              </p>
            </motion.div>
          </div>

          {/* Tournament progress bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tournament progress</span>
              <span style={{ fontSize: 10, color: C.textMuted }}>{completionPct}%</span>
            </div>
            <div style={{ height: 6, background: C.elevated, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${C.gold}99, ${C.gold})`, position: 'relative' }}
              >
                {/* shimmer */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', borderRadius: 3 }}
                />
              </motion.div>
              {/* Tick at 50% */}
              <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', background: `${C.textMuted}66` }} />
            </div>
          </div>

          {error && <p className='mt-2 text-xs' style={{ color: '#E8003D' }}>Live data unavailable.</p>}
        </motion.div>

        {/* ── HERO STATS ROW ── */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-10'>
          <HeroStat icon={<Trophy size={12} />} label="Playoff Leader" value={sortedTable[0].team}
            sub={isSimulating ? 'Calculating...' : `${(mcProbabilities[sortedTable[0].team] || 0).toFixed(1)}% chance`}
            color={C.gold} delay={0.1} glow={C.goldGlow} />
          <HeroStat icon={<Shield size={12} />} label="Qualified" value={qualifiedCount}
            sub="Teams in top 4" color={C.deepGreen} delay={0.15} glow={C.greenGlow} />
          <HeroStat icon={<XCircle size={12} />} label="Eliminated" value={eliminatedCount}
            sub="Out of contention" color={C.deepRed} delay={0.2} glow={C.redGlow} />
          <HeroStat icon={<Cpu size={12} />} label="Simulations" value="10K"
            sub="Monte Carlo iterations" color={C.textMuted} delay={0.25} glow="rgba(154,162,181,0.1)" />
        </div>

        {/* ── QUALIFICATION TABLE ── */}
        <div className='mb-10'>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <p className='section-label' style={{ margin: 0 }}>QUALIFICATION PROBABILITIES — MONTE CARLO</p>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.cardBorder}, transparent)` }} />
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
           <div style={{ minWidth: 650 }}>
            <ScanLineOverlay active={isSimulating} />

            {/* Header */}
            <div className='grid grid-cols-12 gap-2 px-4 py-3' style={{ borderBottom: '1px solid #1E2028', color: '#3D4356', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
              <div className='col-span-1'>#</div>
              <div className='col-span-3'>Team</div>
              <div className='col-span-1 text-center'>M</div>
              <div className='col-span-1 text-center'>W</div>
              <div className='col-span-1 text-center'>L</div>
              <div className='col-span-2 text-center'>NRR</div>
              <div className='col-span-1 text-center'>Pts</div>
              <div className='col-span-2 text-center'>Qual %</div>
            </div>

            {sortedTable.map((entry, idx) => {
              const rank = idx + 1;
              const isTop1 = rank === 1;
              const isQualify = rank <= 4;
              const isEliminated = rank >= 9;
              const team = teamInfo[entry.team];
              const chance = isSimulating ? 0 : (mcProbabilities[entry.team] || 0);
              const status = getTeamStatus(chance);
              const isHovered = hoveredRow === entry.team;

              const barColor = chance > 50 ? C.deepGreen : chance > 10 ? C.gold : C.deepRed;

              return (
                <motion.div
                  key={entry.team}
                  layout
                  layoutId={`analytics-row-${entry.team}`}
                  onHoverStart={() => setHoveredRow(entry.team)}
                  onHoverEnd={() => setHoveredRow(null)}
                  className={`relative grid grid-cols-12 gap-2 px-4 py-3 pt-row ${isTop1 ? 'pt-row-gold' : isQualify ? 'pt-row-qualify' : ''} ${isEliminated ? 'pt-row-eliminated' : ''}`}
                  style={{
                    borderBottom: '1px solid #1E2028',
                    background: isHovered ? `${C.elevated}88` : undefined,
                    transition: 'background 0.2s',
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  {/* Rank left accent line */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0 }}
                        style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                          background: team.color, transformOrigin: 'center',
                        }}
                      />
                    )}
                  </AnimatePresence>

                  <span className='ghost-rank'>{rank}</span>

                  {/* Rank */}
                  <div className='col-span-1 flex items-center'>
                    <motion.span
                      animate={{ color: isTop1 ? C.gold : '#3D4356' }}
                      style={{ fontSize: 13, fontWeight: 700 }}
                    >{rank}</motion.span>
                  </div>

                  {/* Team */}
                  <div className='col-span-3 flex items-center gap-2'>
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      className='w-5 h-5 rounded overflow-hidden shrink-0'
                      style={{ background: C.elevated, padding: 2 }}
                    >
                      <img src={team.logo} alt={entry.team} className='w-full h-full object-contain' onError={(e) => { (e.target as HTMLImageElement).src = team.fallbackLogo || ''; }} />
                    </motion.div>
                    <span className='font-bold text-sm' style={{ fontFamily: 'var(--font-barlow)', color: C.white }}>{entry.team}</span>
                    {!isSimulating && (
                      <div style={{ position: 'relative' }}>
                        <StatusBadge status={status} animate />
                        {(status === 'Q' || status === 'E') && <ParticleBurst color={status === 'Q' ? C.deepGreen : C.deepRed} />}
                      </div>
                    )}
                  </div>

                  <div className='col-span-1 text-center text-sm' style={{ color: '#8890A0' }}>{entry.matches}</div>
                  <div className='col-span-1 text-center text-sm font-semibold' style={{ color: '#E8E8E8' }}>{entry.wins}</div>
                  <div className='col-span-1 text-center text-sm' style={{ color: '#8890A0' }}>{entry.losses}</div>

                  <div className={`col-span-2 text-center text-sm font-semibold ${entry.nrr >= 0 ? 'nrr-positive' : 'nrr-negative'}`}>
                    <span style={{ fontFeatureSettings: '"tnum"' }}>
                      {entry.nrr >= 0 ? '+' : ''}{entry.nrr.toFixed(3)}
                    </span>
                  </div>

                  {/* Points with subtle highlight for top 4 */}
                  <div className='col-span-1 text-center text-lg font-bold' style={{ fontFamily: 'var(--font-barlow)', color: isQualify ? '#E8E8E8' : '#8890A0' }}>
                    {entry.points}
                  </div>

                  {/* Qual % with animated bar */}
                  <div className='col-span-2 text-center'>
                    <div className='flex items-center justify-center gap-2'>
                      <div style={{ flex: 1, height: 4, background: '#1A1D26', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                        <motion.div
                          className='h-full rounded'
                          initial={{ width: 0 }}
                          animate={{ width: `${chance}%` }}
                          transition={{ duration: 1.4, ease: 'easeOut', delay: idx * 0.04 }}
                          style={{ background: barColor, position: 'relative' }}
                        >
                          {/* shimmer on bar */}
                          {chance > 0 && (
                            <motion.div
                              animate={{ x: ['-100%', '300%'] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 1 + idx * 0.1 }}
                              style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
                            />
                          )}
                        </motion.div>
                      </div>
                      <span className='text-sm font-bold' style={{ color: barColor, minWidth: 42, fontFeatureSettings: '"tnum"' }}>
                        {isSimulating ? (
                          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>...</motion.span>
                        ) : <AnimatedPercent value={chance} />}
                      </span>
                    </div>
                  </div>

                  {/* Qualification cutoff line */}
                  {rank === 4 && (
                    <motion.div
                      className='cutoff-line absolute bottom-0 left-0 right-0'
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      style={{
                        height: 2,
                        background: `linear-gradient(90deg, transparent, ${C.gold}66, ${C.gold}, ${C.gold}66, transparent)`,
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
          </div>
        </div>

        {/* ── TEAM PROBABILITY CARDS ── */}
        <div className='mb-10'>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, fontWeight: 700, margin: 0 }}>TEAM QUALIFICATION OUTLOOK</p>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.cardBorder}, transparent)` }} />
          </div>

          <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
            {sortedTable.map((entry, idx) => {
              const team = teamInfo[entry.team];
              const chance = isSimulating ? 0 : (mcProbabilities[entry.team] || 0);
              const status = getTeamStatus(chance);
              const maxPts = maxPossiblePoints[entry.team] || 0;
              const ringColor = chance > 50 ? C.deepGreen : chance > 10 ? C.gold : C.deepRed;

              return (
                <motion.div
                  key={entry.team}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
                  whileHover={{ scale: 1.04, y: -4 }}
                  style={{
                    background: C.cardBg, borderRadius: 10, padding: '16px 12px',
                    textAlign: 'center' as const,
                    borderWidth: 1, borderStyle: 'solid' as const,
                    borderTopColor: status === 'Q' ? 'rgba(29,158,117,0.4)' : status === 'E' ? 'rgba(232,0,61,0.3)' : C.cardBorder,
                    borderRightColor: status === 'Q' ? 'rgba(29,158,117,0.4)' : status === 'E' ? 'rgba(232,0,61,0.3)' : C.cardBorder,
                    borderBottomColor: status === 'Q' ? 'rgba(29,158,117,0.4)' : status === 'E' ? 'rgba(232,0,61,0.3)' : C.cardBorder,
                    borderLeftWidth: 3, borderLeftColor: team.color,
                    boxShadow: status === 'Q' ? '0 0 24px rgba(29,158,117,0.12)' : status === 'E' ? '0 0 24px rgba(232,0,61,0.1)' : 'none',
                    cursor: 'default',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* bg tint on Q */}
                  {status === 'Q' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top, rgba(29,158,117,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 4, overflow: 'hidden', background: C.elevated, padding: 2, flexShrink: 0 }}>
                      <img src={team.logo} alt={entry.team} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = team.fallbackLogo || ''; }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-barlow)', color: C.white }}>{entry.team}</span>
                  </div>

                  {/* Radial progress ring + number */}
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <RadialProgress value={chance} size={64} strokeWidth={4} color={ringColor} />
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-barlow)', color: ringColor, lineHeight: 1 }}>
                        {isSimulating ? (
                          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>...</motion.span>
                        ) : <AnimatedPercent value={chance} />}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                    {!isSimulating && <StatusBadge status={status} animate />}
                  </div>

                  <p style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {status === 'Q' ? '✓ Qualified' : status === 'E' ? '✗ Eliminated' : '⟳ In Race'}
                  </p>
                  <p style={{ fontSize: 9, color: C.textMuted }}>
                    {entry.points}pts · max {maxPts}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── POINTS RACE BAR CHART ── */}
        <div style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, fontWeight: 700, margin: 0 }}>POINTS RACE</p>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.cardBorder}, transparent)` }} />
          </div>

          <div style={{ background: C.cardBg, borderRadius: 10, padding: '24px 24px', border: `1px solid ${C.cardBorder}`, position: 'relative', overflow: 'hidden' }}>
            {/* Background rank watermark */}
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{
                position: 'absolute', right: 16, top: `${(n - 1) * 25}%`,
                fontSize: 80, fontWeight: 900, fontFamily: 'var(--font-barlow)',
                color: 'rgba(255,255,255,0.015)', pointerEvents: 'none', lineHeight: 1,
                userSelect: 'none',
              }}>{n}</div>
            ))}

            {sortedTable.map((entry, idx) => {
              const team = teamInfo[entry.team];
              const maxPts = Math.max(...sortedTable.map(t => t.points), 1);
              const barWidth = (entry.points / maxPts) * 100;
              const status = getTeamStatus(mcProbabilities[entry.team] || 0);
              const isQualify = idx < 4;

              return (
                <motion.div
                  key={entry.team}
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    marginBottom: idx < sortedTable.length - 1 ? 10 : 0,
                    opacity: status === 'E' ? 0.4 : 1,
                    transition: 'opacity 0.4s',
                  }}
                >
                  {/* Rank number */}
                  <span style={{ width: 16, fontSize: 11, fontWeight: 700, color: isQualify ? C.gold : C.textMuted, textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>

                  {/* Team name */}
                  <span style={{ width: 36, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-barlow)', color: C.white, textAlign: 'right', flexShrink: 0 }}>{entry.team}</span>

                  {/* Bar */}
                  <div style={{ flex: 1, height: 22, background: C.elevated, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    {/* Qualification zone shading */}
                    {isQualify && (
                      <div style={{ position: 'absolute', inset: 0, background: `${team.color}08`, pointerEvents: 'none' }} />
                    )}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 1.3, delay: idx * 0.05, ease: 'easeOut' }}
                      style={{
                        height: '100%', borderRadius: 4, position: 'relative', overflow: 'hidden',
                        background: `linear-gradient(90deg, ${team.color}99, ${team.color})`,
                      }}
                    >
                      {/* shimmer */}
                      <motion.div
                        animate={{ x: ['-100%', '300%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 + idx * 0.1 }}
                        style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
                      />
                      {/* Points label inside bar */}
                      {barWidth > 20 && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 + idx * 0.05 }}
                          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-barlow)' }}
                        >
                          {entry.points}
                        </motion.span>
                      )}
                    </motion.div>
                  </div>

                  {/* Points outside if bar too small */}
                  {barWidth <= 20 && (
                    <span style={{ width: 28, fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-barlow)', color: C.white, flexShrink: 0 }}>{entry.points}</span>
                  )}

                  {!isSimulating && <StatusBadge status={status} />}
                </motion.div>
              );
            })}

            {/* Qualification cutoff label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                marginTop: 16, paddingTop: 12,
                borderTop: `1px dashed ${C.gold}33`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 2, background: C.gold, opacity: 0.6 }} />
              <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Playoff qualification zone — top 4
              </span>
            </motion.div>
          </div>
        </div>

        {/* ── STATUS SUMMARY ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap',
            background: C.cardBg, border: `1px solid ${C.cardBorder}`,
            borderRadius: 10, padding: '16px 24px',
            alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Race summary</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: C.deepGreen }} />
              <span style={{ color: C.deepGreen, fontWeight: 700 }}>{qualifiedCount}</span>
              <span style={{ color: C.textMuted }}>Qualified</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: C.gold }} />
              <span style={{ color: C.gold, fontWeight: 700 }}>{aliveCount}</span>
              <span style={{ color: C.textMuted }}>In race</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: C.deepRed }} />
              <span style={{ color: C.deepRed, fontWeight: 700 }}>{eliminatedCount}</span>
              <span style={{ color: C.textMuted }}>Eliminated</span>
            </span>
          </div>
          <span style={{ fontSize: 11, color: C.textMuted }}>{pending} matches remaining</span>
        </motion.div>

      </div>
    </div>
  );
}