import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'reporteng_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'reporteng-super-secret-key-default-32chars';

export interface UserSession {
  userId: string;
  email: string;
  token: string;
  expires: number;
}

export function signSession(session: UserSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySession(cookieValue: string | undefined | null): UserSession | null {
  if (!cookieValue || !cookieValue.includes('.')) return null;
  const [payload, signature] = cookieValue.split('.');
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as UserSession;
    if (Date.now() > session.expires) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return verifySession(sessionCookie?.value);
}

export async function setSessionCookie(session: UserSession) {
  const cookieStore = await cookies();
  const signed = signSession(session);
  cookieStore.set(SESSION_COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

const DEFAULT_SUPABASE_URL = 'https://dwjlkmvcttfokbfjjnfw.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_NhBQlpPzWLoKFwbhTNF43Q_CSGKRt99';

export async function loginWithSupabase(email: string, password: string): Promise<UserSession> {
  const supabaseUrl = (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_KEY || DEFAULT_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL atau Key belum dikonfigurasi di environment variable.');
  }

  // 1. Authenticate with Supabase Auth
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!authResponse.ok) {
    if (authResponse.status === 429) {
      throw new Error('Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.');
    }
    let errorDetail = '';
    try {
      const errJson = await authResponse.json();
      errorDetail = errJson.error_description || errJson.msg || errJson.message || '';
    } catch {}
    throw new Error(errorDetail || 'Login gagal. Periksa email, password, dan konfirmasi akun Supabase.');
  }

  const authData = await authResponse.json();
  const token = authData.access_token;
  const userId = authData.user?.id;
  const userEmail = authData.user?.email || email;

  if (!token || !userId) {
    throw new Error('Respon otentikasi Supabase tidak lengkap.');
  }

  // 2. Verify user in profiles table
  try {
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&id=eq.${userId}&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (profileResponse.ok) {
      const profiles = await profileResponse.json();
      if (!Array.isArray(profiles) || profiles.length === 0) {
        // Warning: profile not found in profiles table, but allow login if allowed or throw error
        console.warn(`User ${userEmail} logged in but no profile found in profiles table.`);
      }
    }
  } catch (err) {
    console.warn('Gagal memverifikasi profiles:', err);
  }

  const session: UserSession = {
    userId,
    email: userEmail,
    token,
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };

  await setSessionCookie(session);
  return session;
}
