'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ReportView from '@/components/ReportView';

export default function LaporanPekerjaanPage() {
  const [hideSidebar, setHideSidebar] = useState(false);

  const toggleSidebar = () => {
    setHideSidebar(!hideSidebar);
    if (!hideSidebar) {
      document.body.classList.add('hide-sidebar');
    } else {
      document.body.classList.remove('hide-sidebar');
    }
  };

  return (
    <>
      <Sidebar dataSource="Supabase" onToggleSidebar={toggleSidebar} />
      <div className="app-shell">
        <Topbar title="Laporan Pekerjaan" onToggleSidebar={toggleSidebar} />
        <ReportView
          source="engineering"
          title="Laporan Pekerjaan"
          heading="Laporan Pekerjaan Engineering"
          description="Aktivitas tim, progres pekerjaan, dan dokumentasi Pekerjaan Engineering"
        />
      </div>
    </>
  );
}
