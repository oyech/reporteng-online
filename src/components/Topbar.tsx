'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  title?: string;
  onToggleSidebar?: () => void;
}

export default function Topbar({ title = 'Laporan Pekerjaan', onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    // Format date in Asia/Jakarta timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
    setTodayStr(formatter.format(now));

    // Fetch user email
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="sidebar-toggle"
          aria-label="Toggle bilah sisi"
          onClick={onToggleSidebar}
        >
          <svg viewBox="0 0 24 24">
            <polyline points="15 19 9 12 15 5" />
          </svg>
        </button>
        <div>
          Workspace <span className="divider">/</span> <strong>{title}</strong>
        </div>
      </div>

      <div className="topbar-right">
        {todayStr && <span className="today">{todayStr}</span>}
        {email && (
          <span className="account-email" title={email}>
            {email}
          </span>
        )}
        <form
          className="logout-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogout();
          }}
        >
          <button type="submit">Keluar</button>
        </form>
      </div>
    </header>
  );
}
