import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  const cookie = serialize('user_token', '', {
    path: '/', // debe coincidir con la cookie original
    httpOnly: true,
    sameSite: 'lax',
    expires: new Date(0), // fecha pasada
  });

  return NextResponse.json({ success: true }, { headers: { 'Set-Cookie': cookie } });
}
