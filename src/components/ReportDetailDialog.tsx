'use client';

import { formatReportItem } from '@/lib/report-helpers';

interface ReportDetailDialogProps {
  isOpen: boolean;
  report: any | null;
  onClose: () => void;
}

export default function ReportDetailDialog({ isOpen, report, onClose }: ReportDetailDialogProps) {
  if (!isOpen || !report) return null;

  const { unit, capitalizedDescription, statusText } = formatReportItem(report, { flatten: false });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-top">
          <strong>Detail Laporan Pekerjaan</strong>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup detail">
            ×
          </button>
        </div>

        <div style={{ padding: '8px 0', fontSize: '14px', lineHeight: '1.7' }}>
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', color: '#666', display: 'block', fontWeight: 600 }}>
              WAKTU (WIB)
            </span>
            <strong>{report.tanggal ? report.tanggal.replace('T', ' ').slice(0, 19) : '—'}</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#666', display: 'block', fontWeight: 600 }}>
                AREA KERJA
              </span>
              <span>{report.area_kerja || '—'}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#666', display: 'block', fontWeight: 600 }}>
                UNIT / AREA
              </span>
              <span>{unit || report.unit_area || '—'}</span>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', color: '#666', display: 'block', fontWeight: 600 }}>
              DESKRIPSI PEKERJAAN
            </span>
            <div style={{ background: '#f8faf9', border: '1px solid #e2ece6', borderRadius: '6px', padding: '12px', whiteSpace: 'pre-wrap' }}>
              {capitalizedDescription || report.pekerjaan || '—'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#666', display: 'block', fontWeight: 600 }}>
                STATUS
              </span>
              <strong>{statusText || report.status || '—'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#666', display: 'block', fontWeight: 600 }}>
                PIC
              </span>
              <span>{report.pic || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
