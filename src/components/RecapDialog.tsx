'use client';

import { useState, useEffect } from 'react';

interface RecapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  source?: 'engineering' | 'dw';
}

export default function RecapDialog({
  isOpen,
  onClose,
  defaultDate,
  source = 'engineering',
}: RecapDialogProps) {
  const [date, setDate] = useState(defaultDate || '');
  const [area, setArea] = useState('');
  const [title, setTitle] = useState('*Tim RM Reguler PIC Tower*');
  const [recapText, setRecapText] = useState('');
  const [count, setCount] = useState(0);
  const [areasList, setAreasList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = defaultDate || new Date().toISOString().slice(0, 10);
      setDate(today);
      loadRecap(today, area, title);
    }
  }, [isOpen, defaultDate, source]);

  const loadRecap = async (targetDate: string, targetArea = '', targetTitle = '') => {
    setLoading(true);
    setRecapText('Memuat rekap laporan…');

    try {
      const params = new URLSearchParams({
        date: targetDate,
        area_kerja: targetArea,
        title: targetTitle || '*Tim RM Reguler PIC Tower*',
        source,
      });

      const res = await fetch(`/api/reports/recap?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setRecapText(data.text || '');
        setCount(data.count || 0);
        if (data.areas) {
          setAreasList(data.areas);
        }
      } else {
        setRecapText(`Gagal memuat rekap: ${data.error}`);
      }
    } catch (err: any) {
      setRecapText(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recapText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Gagal menyalin teks ke clipboard.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([recapText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap_${source}_${date || 'harian'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog recap-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div className="recap-dialog-title">
            <svg viewBox="0 0 24 24" className="recap-title-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            <strong>Rekap Laporan Harian</strong>
            <span className="count-pill">{count} pekerjaan</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup rekap">
            ×
          </button>
        </div>

        <div className="recap-controls">
          <div className="recap-filter-row">
            <div className="recap-field">
              <label htmlFor="recap-date">Tanggal Harian</label>
              <input
                type="date"
                id="recap-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="recap-field">
              <label htmlFor="recap-area">Area Kerja</label>
              <select
                id="recap-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="">Semua Area Kerja</option>
                {areasList.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="recap-field recap-field-title">
              <label htmlFor="recap-title">Judul Tim / Header</label>
              <input
                type="text"
                id="recap-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="*Judul Header*"
              />
            </div>

            <div className="recap-field-btn">
              <button
                type="button"
                className="button apply"
                disabled={loading}
                onClick={() => loadRecap(date, area, title)}
              >
                {loading ? 'Memuat…' : 'Muat Rekap'}
              </button>
            </div>
          </div>
        </div>

        <div className="recap-content-wrap">
          <div className="recap-textarea-header">
            <span>Format Teks (WhatsApp / Dokumen):</span>
            <div className="recap-actions-right">
              <button
                type="button"
                className="recap-action-btn"
                onClick={handleCopy}
              >
                {copied ? '✓ Tersalin!' : 'Salin Teks'}
              </button>
              <button
                type="button"
                className="recap-action-btn"
                onClick={handleDownload}
              >
                Unduh .txt
              </button>
            </div>
          </div>

          <textarea
            className="recap-textarea"
            rows={15}
            value={recapText}
            onChange={(e) => setRecapText(e.target.value)}
            spellCheck={false}
          />

          <div className="recap-footer-hint">
            <small>
              Format siap kirim untuk WhatsApp atau dokumen Word. Teks di atas dapat langsung diedit
              sebelum disalin.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
