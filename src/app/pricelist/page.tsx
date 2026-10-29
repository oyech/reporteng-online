'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { PricelistEntry, formatPrice } from '@/lib/types';

export default function PricelistPage() {
  const [hideSidebar, setHideSidebar] = useState(false);
  const [view, setView] = useState<'detail' | 'jasa'>('detail');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<PricelistEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [catalogCount, setCatalogCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [period, setPeriod] = useState('April 2019–Maret 2020');
  const [criteriaNotes, setCriteriaNotes] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);

  const toggleSidebar = () => {
    setHideSidebar(!hideSidebar);
    if (!hideSidebar) {
      document.body.classList.add('hide-sidebar');
    } else {
      document.body.classList.remove('hide-sidebar');
    }
  };

  const loadPricelist = useCallback(
    async (currentView: 'detail' | 'jasa', qStr: string, catStr: string, targetPage: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          view: currentView,
          q: qStr,
          category: catStr,
          page: String(targetPage),
          size: '25',
        });
        const res = await fetch(`/api/pricelist?${params.toString()}`);
        const data = await res.json();
        setRows(data.rows || []);
        setCategories(data.categories || []);
        setTotal(data.total || 0);
        setCatalogCount(data.catalogCount || 0);
        setPages(data.pages || 1);
        setStart(data.start || 0);
        setEnd(data.end || 0);
        setPeriod(data.period || 'April 2019–Maret 2020');
        setCriteriaNotes(data.criteriaNotes || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPricelist(view, query, category, page);
  }, [loadPricelist, view, page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPricelist(view, query, category, 1);
  };

  const handleReset = () => {
    setQuery('');
    setCategory('');
    setPage(1);
    loadPricelist(view, '', '', 1);
  };

  return (
    <>
      <Sidebar dataSource="Pricelist FLT.xlsx" onToggleSidebar={toggleSidebar} />
      <div className="app-shell">
        <Topbar title="Pricelist Pekerjaan" onToggleSidebar={toggleSidebar} />
        <main className="catalog-page pricelist-page">
          <div className="page-heading">
            <div>
              <div className="eyebrow">KATALOG ENGINEERING</div>
              <h1>
                Pricelist pekerjaan<span>.</span>
              </h1>
              <p>Referensi harga jasa dan material dari Pricelist FLT.xlsx.</p>
            </div>
            <div className="catalog-total">
              <strong>{catalogCount}</strong>
              <span>{view === 'jasa' ? 'tarif jasa' : 'rincian'}</span>
            </div>
          </div>

          <div className="price-period">
            <strong>Periode sumber: {period}</strong>
            <span>
              Harga ditampilkan sesuai Excel, termasuk angka pembulatan dan keterangan persetujuan.
            </span>
          </div>

          <nav className="price-tabs" aria-label="Jenis pricelist">
            <button
              type="button"
              className={view === 'detail' ? 'active' : ''}
              onClick={() => {
                setView('detail');
                setPage(1);
              }}
            >
              Pekerjaan & material
            </button>
            <button
              type="button"
              className={view === 'jasa' ? 'active' : ''}
              onClick={() => {
                setView('jasa');
                setPage(1);
              }}
            >
              Tarif & klasifikasi jasa
            </button>
          </nav>

          <section className="filter-card catalog-search" aria-label="Pencarian pricelist">
            <form onSubmit={handleFilterSubmit}>
              <div className="price-filters">
                <div>
                  <label htmlFor="price-query">Pekerjaan, material, atau kode GP</label>
                  <input
                    type="search"
                    id="price-query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Contoh: cleaning AC, kompressor, HVAC-A"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label htmlFor="price-category">Kategori</label>
                  <select
                    id="price-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Semua kategori</option>
                    {categories.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="button export">
                  Cari
                </button>
                {(query || category) && (
                  <button
                    type="button"
                    className="button presentation-toggle"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="table-card catalog-results" aria-label="Daftar harga">
            <div className="table-heading">
              <div>
                <h2>
                  {view === 'jasa' ? 'Tarif jasa' : 'Pekerjaan & material'}{' '}
                  <span className="count-pill">{total}</span>
                </h2>
                <p>
                  {view === 'jasa'
                    ? 'Lampiran 1 & 2 · Harga dan klasifikasi B, A, A+'
                    : 'Lampiran 3 · Harga dasar 2019 · Nominal sesuai volume yang tercantum'}
                </p>
              </div>
            </div>

            {rows.length > 0 ? (
              <div className="table-scroll">
                {view === 'detail' ? (
                  <table className="price-table">
                    <thead>
                      <tr>
                        <th scope="col">PEKERJAAN / MATERIAL</th>
                        <th scope="col">VOLUME</th>
                        <th scope="col">HARGA JASA</th>
                        <th scope="col">HARGA MATERIAL</th>
                        <th scope="col">TOTAL HARGA</th>
                        <th scope="col">PEMBULATAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <small>{row.category}</small>
                            {row.group && row.group !== row.name && <small>{row.group}</small>}
                            {row.parent && <small>{row.parent}</small>}
                            <strong>{row.name}</strong>
                            {row.code && <code>{row.code}</code>}
                            {row.note && <p className="price-note">{row.note}</p>}
                            <small>
                              Lampiran 3 · Baris {row.row}
                              {row.service_type && ` · ${row.service_type}`}
                            </small>
                            {row.free && <span className="price-free">Free service kepada penghuni</span>}
                          </td>
                          <td>
                            {row.volume !== null && row.volume !== undefined ? row.volume : '—'}{' '}
                            {row.unit || ''}
                          </td>
                          <td>{formatPrice(row.service)}</td>
                          <td>{formatPrice(row.material)}</td>
                          <td>{formatPrice(row.total)}</td>
                          <td>
                            <strong>{formatPrice(row.rounded)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="price-table rate-table">
                    <thead>
                      <tr>
                        <th scope="col">KODE / JENIS PEKERJAAN</th>
                        <th scope="col">B</th>
                        <th scope="col">A</th>
                        <th scope="col">A+</th>
                        <th scope="col">KLASIFIKASI & CONTOH</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{row.code}</strong>
                            <small>{row.type}</small>
                          </td>
                          {row.prices?.map((price, pIdx) => (
                            <td key={pIdx}>{formatPrice(price)}</td>
                          ))}
                          <td>
                            {row.criteria && (
                              <p className="price-note">
                                Waktu: {row.criteria[0]} · Kesulitan: {row.criteria[1]} · Safety:{' '}
                                {row.criteria[2]}
                              </p>
                            )}
                            {row.examples && row.examples.length > 0 ? (
                              <details>
                                <summary>Contoh pekerjaan ({row.examples.length})</summary>
                                <ul style={{ paddingLeft: '18px', margin: '6px 0' }}>
                                  {row.examples.map((ex, eIdx) => (
                                    <li key={eIdx}>{ex}</li>
                                  ))}
                                </ul>
                              </details>
                            ) : (
                              <small>Contoh tidak tercantum.</small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="empty">
                <div className="empty-icon">⌕</div>
                <h3>Pekerjaan tidak ditemukan</h3>
                <p>Coba kata yang lebih singkat atau pilih kategori lain.</p>
                <button
                  type="button"
                  className="button presentation-toggle"
                  onClick={handleReset}
                  style={{ marginTop: '16px' }}
                >
                  Tampilkan semua
                </button>
              </div>
            )}

            <div className="table-footer">
              <span role="status">
                Menampilkan {start}–{end} dari {total} rincian
              </span>
              <nav className="catalog-pagination" aria-label="Halaman pricelist">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Sebelumnya
                </button>
                <span>
                  Halaman {page} / {pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                >
                  Berikutnya →
                </button>
              </nav>
            </div>
          </section>

          {view === 'jasa' && criteriaNotes && Object.keys(criteriaNotes).length > 0 && (
            <section className="price-legend">
              <h2 style={{ marginBottom: '16px' }}>Arti klasifikasi</h2>
              <div>
                {Object.entries(criteriaNotes).map(([label, levels]) => (
                  <article key={label}>
                    <h3>{label}</h3>
                    {Object.entries(levels).map(([level, desc]) => (
                      <p key={level}>
                        <strong>{level}</strong> — {desc}
                      </p>
                    ))}
                  </article>
                ))}
              </div>
            </section>
          )}

          <p className="catalog-note">
            Sumber: Pricelist FLT.xlsx. Tanda — berarti nilai tidak tercantum di sumber. Setiap baris
            merupakan rincian tersendiri; jasa dan material suatu pekerjaan dapat berada pada baris
            berbeda.
          </p>
        </main>
      </div>
    </>
  );
}
