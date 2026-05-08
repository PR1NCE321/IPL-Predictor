import { NextResponse } from 'next/server';
import { getTopBatsmen, getTopBowlers } from '@/services/playerAnalytics';

export async function GET() {
  try {
    const topBatsmen = getTopBatsmen(10);
    const topBowlers = getTopBowlers(10);

    return NextResponse.json({ topBatsmen, topBowlers });
  } catch (err) {
    console.error('player-stats route error', err);
    return NextResponse.json({ topBatsmen: [], topBowlers: [] });
  }
}
