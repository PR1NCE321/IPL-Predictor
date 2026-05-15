import { NextResponse } from 'next/server';
import { Team } from '@/types';
import { buildFantasyTeam } from '@/services/fantasy';

function isTeam(value: string | null): value is Team {
  return !!value && ['MI', 'CSK', 'RCB', 'KKR', 'GT', 'DC', 'PBKS', 'LSG', 'RR', 'SRH'].includes(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const focusTeam = searchParams.get('focusTeam');
  const budgetParam = searchParams.get('budget');
  const budget = budgetParam ? Number(budgetParam) : 100;

  const matchIdParam = searchParams.get('matchId');
  const matchId = matchIdParam ? Number(matchIdParam) : undefined;

  if (Number.isNaN(budget) || budget < 60 || budget > 120) {
    return NextResponse.json({ error: 'Budget must be a number between 60 and 120.' }, { status: 400 });
  }

  const result = buildFantasyTeam(isTeam(focusTeam) ? focusTeam : undefined, budget, matchId);
  return NextResponse.json(result);
}
