import { NextResponse } from 'next/server';
import { Team } from '@/types';
import { getHeadToHeadStats } from '@/services/headToHead';

function isTeam(value: string | null): value is Team {
  return !!value && ['MI', 'CSK', 'RCB', 'KKR', 'GT', 'DC', 'PBKS', 'LSG', 'RR', 'SRH'].includes(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team1 = searchParams.get('team1');
  const team2 = searchParams.get('team2');

  if (!isTeam(team1) || !isTeam(team2) || team1 === team2) {
    return NextResponse.json(
      { error: 'Please provide two different valid team codes.' },
      { status: 400 }
    );
  }

  const stats = getHeadToHeadStats(team1, team2);
  return NextResponse.json(stats);
}
