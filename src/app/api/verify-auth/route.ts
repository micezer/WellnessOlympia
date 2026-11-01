import { NextResponse } from 'next/server';
import { readSession, redirectUrlFor } from '@/lib/auth';

export async function GET() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ isAuthenticated: false });

    return NextResponse.json({
      isAuthenticated: true,
      user: { identifier: session.user.identifier, role: session.role },
      redirectUrl: redirectUrlFor(session.role, session.user),
    });
  } catch (error) {
    console.error('Error verifying auth:', error);
    return NextResponse.json({ isAuthenticated: false });
  }
}
