'use client';

import { useLiveSystemData } from '@/hooks/useLiveSystemData';
import { AlertTriangle, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export function LiveStatusBanner() {
  const { matches, isMockData, loading } = useLiveSystemData();

  if (loading) return null;

  const liveMatches = matches?.filter((m) => m.status === 'live') || [];

  if (liveMatches.length > 0) {
    return (
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="border-b border-rose-500/20 bg-gradient-to-r from-rose-500/20 via-rose-600/20 to-rose-500/20 px-4 py-2 text-center backdrop-blur-md relative z-50"
      >
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-7xl mx-auto text-sm font-semibold text-white/90">
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/30 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse">
            <Radio className="w-4 h-4" />
            LIVE MATCH
          </span>
          {liveMatches.map((match) => (
            <span key={match.id} className="tracking-wide">
              {match.team1} vs {match.team2}
            </span>
          ))}
        </div>
      </motion.div>
    );
  }

  if (isMockData) {
    return (
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="border-b border-fuchsia-400/20 bg-gradient-to-r from-amber-400/10 via-fuchsia-500/10 to-cyan-400/10 px-4 py-2 text-center backdrop-blur-md relative z-50"
      >
        <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto text-sm font-semibold text-white/90">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.25)]">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <span>Notice: This is not updated live data. Run the update script to fetch the latest matches.</span>
        </div>
      </motion.div>
    );
  }

  return null;
}
