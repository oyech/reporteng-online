'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ReportView from '@/components/ReportView';

export default function LaporanDwPage() {
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
      <Sidebar dataSource="Supabase DW" onToggleSidebar={toggleSidebar} />
      <div className="app-shell">
        <Topbar title="Laporan DW" onToggleSidebar={toggleSidebar} />
        <ReportView
          source="dw"
          title="Laporan DW"
          heading="Laporan DW"
          description="Aktivitas tim, progres pekerjaan, dan dokumentasi DW"
        />
      </div>
    </>
  );
}
