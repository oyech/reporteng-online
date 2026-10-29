'use client';

interface PhotoDialogProps {
  isOpen: boolean;
  urls: string[];
  onClose: () => void;
}

export default function PhotoDialog({ isOpen, urls, onClose }: PhotoDialogProps) {
  if (!isOpen || urls.length === 0) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <strong>Dokumentasi pekerjaan ({urls.length} foto)</strong>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Tutup foto">
            ×
          </button>
        </div>
        <div className="photo-gallery-wrap">
          {urls.map((url, idx) => (
            <div key={idx} className="photo-item">
              <img
                src={url}
                alt={`Dokumentasi pekerjaan ${idx + 1}`}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Buka foto asli ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
