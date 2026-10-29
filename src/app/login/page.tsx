'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal.');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">
          <span className="brand-mark">
            r<span>e</span>
          </span>
          <span>
            report<span className="brand-light">eng.</span>
          </span>
        </div>

        <h1>Masuk ke akun tim.</h1>
        <p>Akses workspace laporan operasional engineering.</p>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Memverifikasi…' : 'Masuk ke Workspace →'}
          </button>
        </form>

        <p className="login-help">
          Gunakan akun terdaftar yang telah memiliki hak akses di Supabase.
        </p>
      </div>
    </div>
  );
}
