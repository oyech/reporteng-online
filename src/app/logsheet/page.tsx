'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { LogsheetRow, LogItem } from '@/lib/logsheet-helpers';

export default function LogsheetPage() {
  const [hideSidebar, setHideSidebar] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  const [filledOnly, setFilledOnly] = useState(false);

  const [rows, setRows] = useState<LogsheetRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogsheetRow | null>(null);
  const [logItems, setLogItems] = useState<LogItem[]>([]);
  const [logGroups, setLogGroups] = useState<string[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [filledCount, setFilledCount] = useState(0);
  const [personnel, setPersonnel] = useState<string[]>([]);
  const [payloadValid, setPayloadValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleSidebar = () => {
    setHideSidebar(!hideSidebar);
    if (!hideSidebar) {
      document.body.classList.add('hide-sidebar');
    } else {
      document.body.classList.remove('hide-sidebar');
    }
  };

  const loadLogsheet = useCallback(
    async (
      targetPage: number,
      key?: string,
      searchQuery?: string,
      selectedGrp?: string,
      isFilledOnly?: boolean
    ) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          log: key || '',
          q: searchQuery || '',
          group: selectedGrp || '',
          filled: isFilledOnly ? '1' : '0',
        });

        const res = await fetch(`/api/logsheet?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setRows(data.rows || []);
        setTotal(data.total);
        setSelectedLog(data.selectedLog);
        if (data.selectedLog) {
          setSelectedKey(data.selectedLog.log_key);
        }
        setLogItems(data.logItems || []);
        setLogGroups(data.logGroups || []);
        setItemCount(data.itemCount || 0);
        setFilledCount(data.filledCount || 0);
        setPersonnel(data.personnel || []);
        setPayloadValid(data.payloadValid ?? true);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat logsheet.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadLogsheet(page, selectedKey, query, group, filledOnly);
  }, [loadLogsheet, page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogsheet(page, selectedKey, query, group, filledOnly);
  };

  const handleLogRecordChange = (newKey: string) => {
    setSelectedKey(newKey);
    loadLogsheet(page, newKey, query, group, filledOnly);
  };

  const handleReset = () => {
    setQuery('');
    setGroup('');
    setFilledOnly(false);
    loadLogsheet(page, selectedKey, '', '', false);
  };

  const unfilledCount = itemCount - filledCount;

  return (
    <>
      <Sidebar dataSource="Supabase Logsheets" onToggleSidebar={toggleSidebar} />
      <div className="app-shell">
        <Topbar title="Logsheet" onToggleSidebar={toggleSidebar} />
        <main className="catalog-page">
          <div className="page-heading">
            <div>
              <div className="eyebrow">DATA ENGINEERING</div>
              <h1>
                Logsheet pemeriksaan<span>.</span>
              </h1>
              <p>Catatan kondisi dan hasil pemeriksaan per item.</p>
            </div>
          </div>

          <section className="table-card catalog-results" aria-label="Data logsheet">
            <div className="table-heading">
              <div>
                <h2>
                  Logsheet {total !== null && <span className="count-pill">{total}</span>}
                </h2>
                <p>Pilih catatan, lalu telusuri item pemeriksaannya.</p>
              </div>
              <button
                type="button"
                className="button presentation-toggle"
                onClick={() => loadLogsheet(page, selectedKey, query, group, filledOnly)}
              >
                Muat ulang
              </button>
            </div>

            {/* Controls & Filter */}
            <div className="logsheet-controls">
              <form onSubmit={handleFilterSubmit} className="logsheet-filters">
                <div>
                  <label htmlFor="log-record">Tanggal & shift</label>
                  <select
                    id="log-record"
                    value={selectedKey}
                    onChange={(e) => handleLogRecordChange(e.target.value)}
                  >
                    {rows.map((log) => (
                      <option key={log.log_key} value={log.log_key}>
                        {log.log_date || 'Tanpa tanggal'} · Shift {log.shift || '—'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="log-search">Cari item</label>
                  <input
                    type="search"
                    id="log-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Contoh: genset, tegangan, blower"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label htmlFor="log-group">Kelompok</label>
                  <select
                    id="log-group"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                  >
                    <option value="">Semua kelompok</option>
                    {logGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="button export">
                  Tampilkan
                </button>

                <label className="logsheet-checkbox">
                  <input
                    type="checkbox"
                    checked={filledOnly}
                    onChange={(e) => setFilledOnly(e.target.checked)}
                  />
                  Hanya item terisi
                </label>

                {(query || group || filledOnly) && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={handleReset}
                    style={{ gridColumn: '3 / 5', justifySelf: 'end' }}
                  >
                    Reset filter
                  </button>
                )}
              </form>
            </div>

            {/* Summary */}
            {selectedLog && (
              <div className="logsheet-summary">
                <div>
                  <span>CATATAN PEMERIKSAAN</span>
                  <strong>
                    {selectedLog.log_date || 'Tanpa tanggal'}{' '}
                    <small>· Shift {selectedLog.shift || '—'}</small>
                  </strong>
                  <p>Petugas: {personnel.length > 0 ? personnel.join(', ') : 'Belum tercantum'}</p>
                </div>

                <div className="logsheet-metrics">
                  <div>
                    <strong>{itemCount}</strong>
                    <span>Total item</span>
                  </div>
                  <div>
                    <strong>{filledCount}</strong>
                    <span>Terisi</span>
                  </div>
                  <div>
                    <strong>{unfilledCount}</strong>
                    <span>Belum diisi</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="empty" role="alert">
                <h3>Data belum dapat dimuat</h3>
                <p>{error}</p>
              </div>
            )}

            {!error && !payloadValid && (
              <div className="empty">
                <h3>Rincian belum tersedia</h3>
                <p>Catatan ini belum memiliki rincian pemeriksaan dalam format yang dapat ditampilkan.</p>
              </div>
            )}

            {!error && payloadValid && logItems.length > 0 && (
              <>
                <div className="logsheet-result-count">
                  {logItems.length} dari {itemCount} item ·{' '}
                  {query ? `Hasil pencarian: ${query}` : 'Item dikelompokkan sesuai nama pemeriksaan.'}
                </div>

                <div className="logsheet-scroll">
                  <table className="logsheet-table">
                    <thead>
                      <tr>
                        <th scope="col">No.</th>
                        <th scope="col">Kelompok</th>
                        <th scope="col">Item pemeriksaan</th>
                        <th scope="col">Nilai / kondisi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="logsheet-number">{idx + 1}</td>
                          <td>
                            <span className="logsheet-group">{item.group}</span>
                          </td>
                          <th scope="row">{item.name}</th>
                          <td>
                            {!item.filled ? (
                              <span className="logsheet-unfilled">Belum diisi</span>
                            ) : typeof item.value === 'object' && item.value !== null ? (
                              <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(item.value, null, 2)}
                              </pre>
                            ) : item.value === true ? (
                              'Ya'
                            ) : item.value === false ? (
                              'Tidak'
                            ) : (
                              <span className="logsheet-value">{String(item.value)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!error && payloadValid && logItems.length === 0 && !loading && (
              <div className="empty">
                <h3>{itemCount ? 'Item tidak ditemukan' : 'Belum ada item pemeriksaan'}</h3>
                <p>Coba kata pencarian lain atau reset filter untuk melihat semua item.</p>
              </div>
            )}

            {/* Pagination for log records */}
            <div className="table-footer">
              <span>
                Menampilkan halaman {page} dari pilihan logsheet
              </span>
              <nav className="catalog-pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Sebelumnya
                </button>
                <span>Halaman {page}</span>
                <button
                  type="button"
                  disabled={rows.length < 50}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya →
                </button>
              </nav>
            </div>
          </section>

          <p className="catalog-note">
            Sumber: eibnrigeisychgfwowrx.supabase.co · Catatan logsheet operasional engineering.
          </p>
        </main>
      </div>
    </>
  );
}
