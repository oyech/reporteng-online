'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  dataSource?: string;
  onToggleSidebar?: () => void;
}

export default function Sidebar({ dataSource, onToggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Laporan Pekerjaan Engineering',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      ),
      active: pathname === '/',
    },
    {
      href: '/laporan-dw',
      label: 'Laporan DW',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      ),
      active: pathname.startsWith('/laporan-dw'),
    },
    {
      href: '/kode-item',
      label: 'Kode Item',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h4" />
        </svg>
      ),
      active: pathname.startsWith('/kode-item'),
    },
    {
      href: '/pricelist',
      label: 'Pricelist Pekerjaan',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 4h10l6 6-10 10-6-6z" />
          <circle cx="9" cy="9" r="1" />
        </svg>
      ),
      active: pathname.startsWith('/pricelist'),
    },
    {
      href: '/logsheet',
      label: 'Logsheet',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18" />
        </svg>
      ),
      active: pathname.startsWith('/logsheet'),
    },
  ];

  const currentSource =
    dataSource ||
    (pathname.startsWith('/kode-item')
      ? 'Kode Item.xlsx'
      : pathname.startsWith('/pricelist')
      ? 'Pricelist FLT.xlsx'
      : pathname.startsWith('/logsheet')
      ? 'Supabase Logsheets'
      : pathname.startsWith('/laporan-dw')
      ? 'Supabase DW'
      : 'Supabase');

  return (
    <>
      <aside className="sidebar">
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

        <Link href="/" className="brand" aria-label="ReportEng beranda">
          <span className="brand-mark">
            r<span>e</span>
          </span>
          <span>
            report<span className="brand-light">eng.</span>
          </span>
        </Link>

        <p className="nav-label">WORKSPACE</p>

        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${item.active ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="sidebar-note">
          <span className="note-icon">↗</span>
          <h3>
            Kerja sewajarnya,
            <br />
            Loyalitas secukupnya.
          </h3>
          <p>
            Dedikasi kerja bagus,
            <br />
            tetap bisa jadi baris yang dihapus.
          </p>
          <span className="note-line"></span>
        </div>

        <div className="sidebar-footer">
          <span className="connection-dot"></span>
          Sumber data: {currentSource}
          <small>REPORTENG • ENGINEERING REPORTS</small>
        </div>
      </aside>

      <nav className="mobile-workspace-nav" aria-label="Workspace">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>
          Laporan
        </Link>
        <Link href="/laporan-dw" className={pathname.startsWith('/laporan-dw') ? 'active' : ''}>
          Laporan DW
        </Link>
        <Link href="/kode-item" className={pathname.startsWith('/kode-item') ? 'active' : ''}>
          Kode Item
        </Link>
        <Link href="/pricelist" className={pathname.startsWith('/pricelist') ? 'active' : ''}>
          Pricelist
        </Link>
        <Link href="/logsheet" className={pathname.startsWith('/logsheet') ? 'active' : ''}>
          Logsheet
        </Link>
      </nav>
    </>
  );
}
