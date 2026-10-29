'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { CatalogItem } from '@/lib/types';

export default function KodeItemPage() {
  const [hideSidebar, setHideSidebar] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [codeCount, setCodeCount] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [catalogCount, setCatalogCount] = useState(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleSidebar = () => {
    setHideSidebar(!hideSidebar);
    if (!hideSidebar) {
      document.body.classList.add('hide-sidebar');
    } else {
      document.body.classList.remove('hide-sidebar');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadItems = useCallback(async (searchQ: string, targetPage: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/items?q=${encodeURIComponent(searchQ)}&page=${targetPage}&size=25`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setStart(data.start || 0);
      setEnd(data.end || 0);
      setCodeCount(data.codeCount || 0);
      setSourceCount(data.sourceCount || 0);
      setCatalogCount(data.catalogCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems(query, page);
  }, [loadItems, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadItems(query, 1);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Kode ${code} berhasil disalin ke clipboard!`);
    } catch {
      prompt('Salin kode item di bawah ini:', code);
    }
  };

  return (
    <>
      <Sidebar dataSource="Kode Item.xlsx" onToggleSidebar={toggleSidebar} />
      <div className="app-shell">
        <Topbar title="Kode Item" onToggleSidebar={toggleSidebar} />
        <main className="catalog-page">
          <div className="page-heading">
            <div>
              <div className="eyebrow">KATALOG ENGINEERING</div>
              <h1>
                Cari kode item<span>.</span>
              </h1>
              <p>Temukan kode barang dan material untuk kebutuhan pekerjaan engineering.</p>
            </div>
            <div className="catalog-total">
              <strong>{codeCount.toLocaleString('id-ID')}</strong>
              <span>kode item</span>
            </div>
          </div>

          <section className="table-card catalog-results" aria-label="Hasil pencarian">
            <div className="table-heading">
              <div>
                <h2>
                  {query ? 'Hasil pencarian' : 'Daftar barang & material'}{' '}
                  <span className="count-pill">{total.toLocaleString('id-ID')}</span>
                </h2>
                <p>
                  {query
                    ? `Hasil untuk “${query}”`
                    : 'Nama, kode, dan satuan sesuai katalog master data.'}
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="search-box item-table-search">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari kode atau nama..."
                  maxLength={200}
                  aria-label="Cari kode item atau nama barang"
                />
              </form>
            </div>

            {items.length > 0 ? (
              <div className="table-scroll">
                <table className="catalog-table item-code-table">
                  <thead>
                    <tr>
                      <th scope="col">KODE ITEM</th>
                      <th scope="col">NAMA BARANG / MATERIAL</th>
                      <th scope="col">SATUAN</th>
                      <th scope="col">TINDAKAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={`${item.code}-${idx}`}>
                        <td>
                          <code>{item.code}</code>
                        </td>
                        <td>
                          {item.name}
                          {item.variants > 1 && (
                            <small className="catalog-variant">
                              Kode ini memiliki {item.variants} variasi nama di sumber
                            </small>
                          )}
                        </td>
                        <td>{item.satuan || '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="copy-code"
                            onClick={() => handleCopyCode(item.code)}
                            aria-label={`Salin kode ${item.code}`}
                          >
                            Salin kode
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty">
                <div className="empty-icon">⌕</div>
                <h3>Barang tidak ditemukan</h3>
                <p>Coba kata yang lebih singkat, nama merek, ukuran, atau sebagian kode item.</p>
                <button
                  type="button"
                  className="button presentation-toggle"
                  onClick={() => {
                    setQuery('');
                    setPage(1);
                    loadItems('', 1);
                  }}
                  style={{ marginTop: '16px' }}
                >
                  Tampilkan semua barang
                </button>
              </div>
            )}

            <div className="table-footer">
              <span>
                Menampilkan {start}–{end} dari {total.toLocaleString('id-ID')} barang
              </span>
              <nav className="catalog-pagination" aria-label="Halaman hasil pencarian">
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

          <p className="catalog-note">
            {sourceCount.toLocaleString('id-ID')} baris sumber diringkas menjadi{' '}
            {catalogCount.toLocaleString('id-ID')} pasangan kode–nama. Pengulangan identik
            ditampilkan satu kali; variasi nama tetap dipertahankan.
          </p>
        </main>
      </div>

      {toastMessage && <div className="toast-notice">{toastMessage}</div>}
    </>
  );
}
