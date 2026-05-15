'use client';

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import venueData from '@/data/venueStats.json';
import { MapPin, Trophy, Target, TrendingUp, ChevronDown } from 'lucide-react';

const C = {
  white: '#FFFFFF', textPrimary: '#F0F2F5', textSecondary: '#C5CBD6',
  textMuted: '#9AA2B5', gold: '#D4AF37', green: '#34D399', red: '#F87171',
  cardBg: '#131620', cardBorder: '#1F2233', elevated: '#1A1D26',
};

export default function VenuesPage() {
  const [sortConfig, setSortConfig] = useState({ key: 'matches', direction: 'desc' });

  const sortedVenues = useMemo(() => {
    let sortableItems = Object.entries(venueData as Record<string, any>).map(([name, stats]) => ({
      name,
      ...stats
    })).filter(v => v.matches > 5); // Only show venues with enough matches

    sortableItems.sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [sortConfig]);

  const requestSort = (key: string) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  return (
    <div className='min-h-screen p-6 md:p-8' style={{ position: 'relative' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(212,175,55,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212,175,55,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      <div className='max-w-[1200px] mx-auto' style={{ position: 'relative', zIndex: 1 }}>
        
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className='mb-8'>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gold }}>
              <MapPin size={24} />
            </div>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>IPL ALL-TIME</p>
              <h1 className='text-3xl md:text-4xl font-bold tracking-tight' style={{ fontFamily: 'var(--font-barlow)', color: C.white, lineHeight: 1 }}>
                VENUE ANALYTICS
              </h1>
            </div>
          </div>
          <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 12, maxWidth: 600 }}>
            Analyze how different grounds behave. Discover whether the pitch heavily favors the team batting first, or if chasing is the golden rule.
          </p>
        </motion.div>

        <div style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.cardBorder}`, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 800, textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.cardBorder}`, background: C.elevated }}>
                  <th style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }} onClick={() => requestSort('name')}>
                    Venue {sortConfig.key === 'name' && <ChevronDown size={14} style={{ display: 'inline', transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : '' }} />}
                  </th>
                  <th style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }} onClick={() => requestSort('matches')}>
                    Matches {sortConfig.key === 'matches' && <ChevronDown size={14} style={{ display: 'inline', transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : '' }} />}
                  </th>
                  <th style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }} onClick={() => requestSort('avgFirstInnings')}>
                    Avg 1st Inn {sortConfig.key === 'avgFirstInnings' && <ChevronDown size={14} style={{ display: 'inline', transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : '' }} />}
                  </th>
                  <th style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }} onClick={() => requestSort('batFirstWins')}>
                    Bat First Win % {sortConfig.key === 'batFirstWins' && <ChevronDown size={14} style={{ display: 'inline', transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : '' }} />}
                  </th>
                  <th style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 11, color: C.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }} onClick={() => requestSort('chaseWins')}>
                    Chase Win % {sortConfig.key === 'chaseWins' && <ChevronDown size={14} style={{ display: 'inline', transform: sortConfig.direction === 'asc' ? 'rotate(180deg)' : '' }} />}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedVenues.map((v, i) => {
                  const totalDecisive = v.batFirstWins + v.chaseWins;
                  const batFirstPct = totalDecisive > 0 ? Math.round((v.batFirstWins / totalDecisive) * 100) : 0;
                  const chasePct = totalDecisive > 0 ? Math.round((v.chaseWins / totalDecisive) * 100) : 0;

                  return (
                    <motion.tr 
                      key={v.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: C.white }}>{v.name}</td>
                      <td style={{ padding: '16px 20px', color: C.textSecondary }}>{v.matches}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: v.avgFirstInnings > 170 ? C.green : v.avgFirstInnings < 150 ? C.red : C.gold }}>
                        {v.avgFirstInnings}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: C.elevated, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: C.gold, width: `${batFirstPct}%` }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.white, width: 30 }}>{batFirstPct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: C.elevated, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: C.green, width: `${chasePct}%` }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.white, width: 30 }}>{chasePct}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
