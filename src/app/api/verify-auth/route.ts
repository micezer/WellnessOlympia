import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/db/db';
import { coaches, players } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SECRET_KEY = process.env.JWT_SECRET || 'clave-secreta-super-segura';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('user_token');

    if (!token) {
      return NextResponse.json({ isAuthenticated: false });
    }

    const decoded = jwt.verify(token.value, SECRET_KEY) as {
      identifier: string;
      role: 'coach' | 'player';
    };

    let redirectUrl = '/';

    if (decoded.role === 'coach') {
      const coach = await db
        .select()
        .from(coaches)
        .where(eq(coaches.identifier, decoded.identifier));
      if (coach.length) {
        redirectUrl = coach[0].chosen_team
          ? `/coach/dashboard/${coach[0].chosen_team}`
          : '/coach/choose-team';
      }
    } else if (decoded.role === 'player') {
      const player = await db
        .select()
        .from(players)
        .where(eq(players.identifier, decoded.identifier));
      if (player.length) {
        redirectUrl = '/player/welcome';
      }
    }

    return NextResponse.json({
      isAuthenticated: true,
      user: { identifier: decoded.identifier, role: decoded.role },
      redirectUrl,
    });
  } catch (error) {
    console.error('Error verifying auth:', error);
    return NextResponse.json({ isAuthenticated: false });
  }
}
