'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import PhotoDialog from './PhotoDialog';
import ReportDetailDialog from './ReportDetailDialog';
import RecapDialog from './RecapDialog';
import { ReportItem, FilterOptions } from '@/lib/report-helpers';

interface ReportViewProps {
  source: 'engineering' | 'dw';
  title: string;
  heading: string;
  description: string;
}

function getStatusCategory(statusStr: string): 'done' | 'progress' | 'pending' {
  const s = (statusStr || '').toLowerCase().replace(/^progressstatus\./, '').trim();
  if (['selesai', 'done', 'completed', 'complete', 'closed', 'finish', 'finished'].includes(s)) {
    return 'done';
  }
  if (['proses', 'dalam proses', 'in progress', 'progress', 'on progress', 'ongoing', 'sedang dikerjakan'].includes(s)) {
    return 'progress';
  }
  return 'pending';
}

function formatDisplayDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).format(d);
  } catch {
    return isoString;
  }
}

export default function ReportView({ source, title, heading, description }: ReportViewProps) {
  const [dates, setDates] = useState({ start: '', end: '' });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const now = new Date();
    let Y = now.getFullYear();
    let M = String(now.getMonth() + 1).padStart(2, '0');
    let D = String(now.getDate()).padStart(2, '0');

    // Data di Supabase report_eng tercatat pada tahun 2026 (September - Oktober 2026).
    // Jika sistem browser pengguna masih tahun sebelum 2026 (misal 2024/2025), fallback ke Oktober 2026.
    if (Y < 2026) {
      Y = 2026;
      M = '10';
      D = '31';
    }

    setDates({
      start: `${Y}-${M}-01`,
      end: `${Y}-${M}-${D}`,
    });
    setInitialized(true);
  }, []);

  const [filterValues, setFilterValues] = useState({
    area_kerja: '',
    unit_area: '',
    status: '',
    pic: '',
  });

  const [options, setOptions] = useState<FilterOptions>({
    area_kerja: [],
    unit_area: [],
    status: [],
    pic: [],
  });

  const [allRows, setAllRows] = useState<ReportItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Presentation mode
  const [presenting, setPresenting] = useState(false);

  // Dialog states
  const [photoDialogUrls, setPhotoDialogUrls] = useState<string[]>([]);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  const [detailReport, setDetailReport] = useState<ReportItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isRecapOpen, setIsRecapOpen] = useState(false);

  const isFirstLoad = useRef(true);

  const loadReports = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      setErrorNotice(null);

      try {
        const params = new URLSearchParams();
        if (dates.start) params.set('start', dates.start);
        if (dates.end) params.set('end', dates.end);
        if (filterValues.area_kerja) params.set('area_kerja', filterValues.area_kerja);
        if (filterValues.unit_area) params.set('unit_area', filterValues.unit_area);
        if (filterValues.status) params.set('status', filterValues.status);
        if (filterValues.pic) params.set('pic', filterValues.pic);
        params.set('source', source);

        const res = await fetch(`/api/${source === 'dw' ? 'dw/reports' : 'reports'}?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setAllRows(data.rows || []);
        if (data.options) {
          setOptions(data.options);
        }
      } catch (err: any) {
        if (!isBackground) {
          setErrorNotice(err.message || 'Gagal memuat data laporan.');
        }
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [dates, filterValues, source]
  );

  useEffect(() => {
    if (initialized) {
      loadReports();
    }
  }, [initialized, dates.start, dates.end, loadReports]);

  // Auto-refresh interval (5s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadReports(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadReports]);

  // Client-side text search
  const filteredRows = allRows.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const str = `${r.tanggal} ${r.area_kerja} ${r.unit_area} ${r.pekerjaan} ${r.status} ${r.pic}`.toLowerCase();
    return str.includes(q);
  });

  // Stats calculation
  const totalCount = filteredRows.length;
  const doneCount = filteredRows.filter((r) => getStatusCategory(r.status) === 'done').length;
  const progressCount = filteredRows.filter((r) => getStatusCategory(r.status) === 'progress').length;
  const pendingCount = filteredRows.filter((r) => getStatusCategory(r.status) === 'pending').length;

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const fromIndex = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(fromIndex, fromIndex + pageSize);

  // Presentation mode keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (presenting) {
        if (e.key === 'Escape') {
          setPresenting(false);
          document.body.classList.remove('presenting');
        } else if (e.key === 'ArrowLeft') {
          setPage((p) => Math.max(1, p - 1));
        } else if (e.key === 'ArrowRight') {
          setPage((p) => Math.min(totalPages, p + 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presenting, totalPages]);

  const togglePresentation = () => {
    const next = !presenting;
    setPresenting(next);
    if (next) {
      document.body.classList.add('presenting');
    } else {
      document.body.classList.remove('presenting');
    }
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams({
      start: dates.start,
      end: dates.end,
      area_kerja: filterValues.area_kerja,
      unit_area: filterValues.unit_area,
      status: filterValues.status,
      pic: filterValues.pic,
      q: searchQuery,
      source,
    });
    window.location.href = `/api/export?${params.toString()}`;
  };

  const handleResetFilters = () => {
    setDates({ start: '', end: '' });
    setFilterValues({ area_kerja: '', unit_area: '', status: '', pic: '' });
    setSearchQuery('');
    setPage(1);
  };

  return (
    <>
      <main>
        <div className="page-heading">
          <div>
            <div className="eyebrow">ENGINEERING WORKSPACE</div>
            <h1>
              {heading}
              <span>.</span>
            </h1>
            <p>{description}</p>
          </div>

          <div className="heading-actions">
            <button
              type="button"
              className="button recap-button"
              onClick={() => setIsRecapOpen(true)}
              title="Rekap laporan harian berdasarkan area kerja"
            >
              <svg viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span>Rekap Harian</span>
            </button>

            <Link href="/kode-item" className="button presentation-toggle">
              Cari kode item
            </Link>

            <button
              type="button"
              className="button presentation-toggle"
              aria-pressed={presenting}
              onClick={togglePresentation}
            >
              Mode presentasi
            </button>

            <button
              type="button"
              className="button export"
              disabled={totalCount === 0 || loading}
              onClick={handleExportExcel}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" />
              </svg>
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {presenting && (
          <div className="presentation-context">
            <span>
              Menampilkan {fromIndex + 1}–{Math.min(fromIndex + pageSize, totalCount)} dari{' '}
              {totalCount.toLocaleString('id-ID')} pekerjaan
            </span>
            <span>← → Halaman · Esc Keluar</span>
          </div>
        )}

        {/* Stats */}
        <div className="stats">
          <section className="stat">
            <div>
              <span>Total pekerjaan</span>
              <span className="stat-icon neutral">▤</span>
            </div>
            <strong>{loading ? '…' : totalCount.toLocaleString('id-ID')}</strong>
            <p>Dalam hasil filter</p>
          </section>

          <section className="stat">
            <div>
              <span>Selesai</span>
              <span className="stat-icon green">✓</span>
            </div>
            <strong>{loading ? '…' : doneCount.toLocaleString('id-ID')}</strong>
            <p>
              <i className="tiny-dot green-bg"></i>Pekerjaan terselesaikan
            </p>
          </section>

          <section className="stat">
            <div>
              <span>Dalam proses</span>
              <span className="stat-icon amber">◷</span>
            </div>
            <strong>{loading ? '…' : progressCount.toLocaleString('id-ID')}</strong>
            <p>
              <i className="tiny-dot amber-bg"></i>Sedang dikerjakan
            </p>
          </section>

          <section className="stat">
            <div>
              <span>Menunggu / lainnya</span>
              <span className="stat-icon gray">···</span>
            </div>
            <strong>{loading ? '…' : pendingCount.toLocaleString('id-ID')}</strong>
            <p>
              <i className="tiny-dot gray-bg"></i>Status pekerjaan lainnya
            </p>
          </section>
        </div>

        {/* Filters */}
        <section className="filter-card" aria-label="Filter laporan">
          <div className="section-title">
            <h2>
              <svg viewBox="0 0 24 24">
                <path d="M4 7h16M7 12h10M10 17h4" />
              </svg>
              Filter laporan
            </h2>
            <button type="button" className="text-button" onClick={handleResetFilters}>
              ↻ Reset filter
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              loadReports();
            }}
          >
            <div className="filter-grid">
              <div className="period-field">
                <label>Periode tanggal</label>
                <div className="date-range">
                  <input
                    type="date"
                    value={dates.start}
                    onChange={(e) => setDates({ ...dates, start: e.target.value })}
                    aria-label="Tanggal mulai"
                  />
                  <span>→</span>
                  <input
                    type="date"
                    value={dates.end}
                    onChange={(e) => setDates({ ...dates, end: e.target.value })}
                    aria-label="Tanggal akhir"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="area_kerja">Area kerja</label>
                <select
                  id="area_kerja"
                  value={filterValues.area_kerja}
                  onChange={(e) => setFilterValues({ ...filterValues, area_kerja: e.target.value })}
                >
                  <option value="">Semua area</option>
                  {options.area_kerja.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="unit_area">Unit / Area</label>
                <select
                  id="unit_area"
                  value={filterValues.unit_area}
                  onChange={(e) => setFilterValues({ ...filterValues, unit_area: e.target.value })}
                >
                  <option value="">Semua unit</option>
                  {options.unit_area.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={filterValues.status}
                  onChange={(e) => setFilterValues({ ...filterValues, status: e.target.value })}
                >
                  <option value="">Semua status</option>
                  {options.status.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pic">PIC</label>
                <select
                  id="pic"
                  value={filterValues.pic}
                  onChange={(e) => setFilterValues({ ...filterValues, pic: e.target.value })}
                >
                  <option value="">Semua PIC</option>
                  {options.pic.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-bottom">
              <span id="period-caption">
                {dates.start || dates.end
                  ? `${dates.start || 'Awal'} → ${dates.end || 'Terbaru'} (UTC+7, tanggal akhir termasuk)`
                  : 'Semua tanggal (tanpa batas periode)'}
                {' • Filter aktif juga digunakan untuk export Excel'}
              </span>
              <button className="button apply" type="submit">
                Terapkan filter <span>→</span>
              </button>
            </div>
          </form>
        </section>

        {/* Table Card */}
        <section className="table-card">
          <div className="table-heading">
            <div>
              <h2>
                Daftar pekerjaan <span className="count-pill">{totalCount.toLocaleString('id-ID')}</span>
              </h2>
              <p>Catatan pekerjaan dan dokumentasi lapangan.</p>
            </div>

            <div className="table-actions">
              <div className="search-box">
                <svg viewBox="0 0 24 24">
                  <circle cx="10" cy="10" r="6" />
                  <path d="m15 15 5 5" />
                </svg>
                <input
                  type="search"
                  placeholder="Cari pekerjaan, area, PIC…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  autoComplete="off"
                />
              </div>

              <button
                type="button"
                className="refresh"
                onClick={() => loadReports()}
                aria-label="Muat ulang laporan"
                title="Muat ulang"
              >
                ↻
              </button>

              <button
                type="button"
                className={`auto-refresh-toggle ${autoRefresh ? 'active' : ''}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
                aria-label="Toggle auto-refresh"
                title="Toggle auto-refresh (5s)"
              >
                ⟳
              </button>

              {autoRefresh && <span className="auto-refresh-indicator">Auto-refresh aktif</span>}
            </div>
          </div>

          {errorNotice && (
            <div
              style={{
                margin: '0 23px 20px',
                border: '1px solid #e9dbbb',
                background: '#fffbf1',
                color: '#7a540f',
                padding: '13px 15px',
                borderRadius: '6px',
                fontSize: '11px',
                lineHeight: '1.7',
              }}
            >
              {errorNotice}
            </div>
          )}

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>TANGGAL & WAKTU (UTC+7)</th>
                  <th style={{ width: '130px' }}>AREA KERJA</th>
                  <th style={{ width: '130px' }}>UNIT / AREA</th>
                  <th className="job-col" style={{ width: '400px' }}>
                    PEKERJAAN
                  </th>
                  <th style={{ width: '110px' }}>STATUS</th>
                  <th style={{ width: '140px' }}>PIC</th>
                  <th style={{ width: '90px' }}>FOTO</th>
                  <th style={{ width: '80px' }}>VIEW</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, idx) => {
                  const statusCat = getStatusCategory(r.status);
                  const picNames = (r.pic || '')
                    .split('|')
                    .map((n) => n.trim())
                    .filter(Boolean);
                  const initials =
                    picNames.length > 0
                      ? picNames[0]
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((p) => p[0] || '')
                          .join('')
                          .toUpperCase()
                      : '–';

                  return (
                    <tr key={`${r.id}-${idx}`}>
                      <td>{formatDisplayDate(r.tanggal)}</td>
                      <td>{r.area_kerja || '—'}</td>
                      <td>{r.unit_area || '—'}</td>
                      <td className="job-cell">{r.pekerjaan || '—'}</td>
                      <td>
                        <span className={`badge ${statusCat}`}>
                          {r.status || 'Tanpa status'}
                        </span>
                      </td>
                      <td>
                        <div className="pic-cell">
                          <span className="pic-avatar">{initials}</span>
                          <span>{picNames.length > 0 ? picNames.join(' | ') : r.pic || '—'}</span>
                        </div>
                      </td>
                      <td>
                        {r.foto && r.foto.length > 0 ? (
                          <button
                            type="button"
                            className="photo-button"
                            onClick={() => {
                              setPhotoDialogUrls(r.foto);
                              setIsPhotoOpen(true);
                            }}
                          >
                            <img
                              src={r.foto[0]}
                              alt=""
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <span>{r.foto.length > 1 ? `+${r.foto.length - 1}` : 'Lihat'}</span>
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="report-view-button"
                          onClick={() => {
                            setDetailReport(r);
                            setIsDetailOpen(true);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalCount === 0 && !loading && (
            <div className="empty">
              <div className="empty-icon">▤</div>
              <h3>Belum ada laporan</h3>
              <p>
                {dates.start || dates.end
                  ? `Tidak ada data pekerjaan pada periode ${dates.start || 'awal'} s/d ${dates.end || 'terbaru'}.`
                  : 'Tidak ada data pekerjaan ditemukan.'}
                {source === 'engineering' &&
                  ' Pastikan Anda login dengan akun SPV/Admin atau memiliki hak akses area kerja terkait di Supabase.'}
              </p>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button"
                  style={{ fontSize: '11px', padding: '6px 14px' }}
                  onClick={handleResetFilters}
                >
                  Tampilkan Semua Periode
                </button>
                <button
                  type="button"
                  className="button"
                  style={{ fontSize: '11px', padding: '6px 14px', background: '#204f40', color: '#fff' }}
                  onClick={() => {
                    setDates({ start: '2026-10-01', end: '2026-10-31' });
                    setFilterValues({ area_kerja: '', unit_area: '', status: '', pic: '' });
                  }}
                >
                  Lihat Periode Aktif (Oktober 2026)
                </button>
              </div>
            </div>
          )}

          <div className="table-footer">
            <span>
              {totalCount > 0
                ? `Menampilkan ${fromIndex + 1}–${Math.min(
                    fromIndex + pageSize,
                    totalCount
                  )} dari ${totalCount.toLocaleString('id-ID')} pekerjaan`
                : '0 pekerjaan ditampilkan'}
            </span>

            <div className="pagination">
              <label htmlFor="page-size">Baris per halaman</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Halaman sebelumnya"
              >
                ‹
              </button>

              <span>
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Halaman berikutnya"
              >
                ›
              </button>
            </div>
          </div>
        </section>

        <footer className="main-footer">
          <span>
            ReportEng <span className="footer-divider">/</span> Ruang kerja engineering yang terorganisir.
          </span>
          <span>Data dari Supabase</span>
        </footer>
      </main>

      {/* Dialogs */}
      <PhotoDialog
        isOpen={isPhotoOpen}
        urls={photoDialogUrls}
        onClose={() => setIsPhotoOpen(false)}
      />

      <ReportDetailDialog
        isOpen={isDetailOpen}
        report={detailReport}
        onClose={() => setIsDetailOpen(false)}
      />

      <RecapDialog
        isOpen={isRecapOpen}
        defaultDate={dates.end}
        source={source}
        onClose={() => setIsRecapOpen(false)}
      />
    </>
  );
}
