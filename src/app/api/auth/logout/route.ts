import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  await clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('reporteng_session');
  return res;
}
