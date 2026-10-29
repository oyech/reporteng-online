import { NextRequest, NextResponse } from 'next/server';
import { loginWithSupabase } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Isi email dan password.' }, { status: 400 });
    }

    const session = await loginWithSupabase(email.trim(), password);
    return NextResponse.json({ ok: true, user: { email: session.email, id: session.userId } });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan saat masuk.' },
      { status: 401 }
    );
  }
}
