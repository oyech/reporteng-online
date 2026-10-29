import { NextRequest, NextResponse } from 'next/server';
import { loginWithSupabase, signSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Isi email dan password.' }, { status: 400 });
    }

    const session = await loginWithSupabase(email.trim(), password);
    const res = NextResponse.json({ ok: true, user: { email: session.email, id: session.userId } });

    res.cookies.set('reporteng_session', signSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan saat masuk.' },
      { status: 401 }
    );
  }
}
