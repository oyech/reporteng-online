# ReportEng Online (Next.js Clone)

Aplikasi Next.js App Router (TypeScript) sebagai clone modern dari `reporteng-view`. Aplikasi ini secara khusus berfokus pada 5 modul utama engineering operasional:

1. **Laporan Pekerjaan Engineering** (`/`)
2. **Laporan DW** (`/laporan-dw`)
3. **Kode Item** (`/kode-item`)
4. **Pricelist Pekerjaan** (`/pricelist`)
5. **Logsheet** (`/logsheet`)

---

## 🚀 Fitur Utama

### 1. Laporan Pekerjaan & Laporan DW
- **Filter Fleksibel:** Filter rentang tanggal (WIB / Asia/Jakarta), Area Kerja, Unit/Area, Status, dan PIC.
- **Statistik Cepat:** Kartu ringkasan pekerjaan total, selesai, dalam proses, dan menunggu/pending.
- **Pencarian Real-time:** Pencarian cepat berbasis teks pada seluruh baris pekerjaan.
- **Auto-Refresh & Manual Refresh:** Polling data setiap 5 detik dengan toggle status aktif.
- **Dokumentasi Foto:** Dialog pratinjau galeri foto lapangan dengan tautan gambar resolusi penuh.
- **Detail Laporan (View Modal):** Inspeksi detail pekerjaan dalam modal terstruktur.
- **Rekap Harian WhatsApp:** Generator teks rekap harian otomatis terkelompok per Tower & Area, siap salin ke WhatsApp atau unduh sebagai file `.txt`.
- **Mode Presentasi:** Tampilan layar penuh dengan ukuran tipografi optimal untuk proyektor atau rapat tinjauan tim (navigasi keyboard panah kiri/kanan, tombol `Esc` untuk keluar).
- **Export Excel (`.xlsx`):** Unduh laporan tersaring langsung ke format spreadsheet Excel dengan format rapi dan tautan foto.

### 2. Kode Item
- Pencarian katalog barang dan material engineering dari master data `items.json`.
- Tombol satu klik **"Salin kode"** dengan notifikasi toast.
- Indikator variasi nama barang pada sumber data.
- Paginasi 25 item per halaman.

### 3. Pricelist Pekerjaan
- **Tab Pekerjaan & Material (Detail):** Rincian volume, harga jasa, harga material, total harga, pembulatan, dan catatan persetujuan/free service.
- **Tab Tarif & Klasifikasi Jasa:** Tarif klasifikasi B, A, dan A+ berdasarkan waktu, tingkat kesulitan, dan safety dengan contoh pekerjaan.
- **Pencarian & Filter Kategori:** Filter dropdown kategori serta pencarian teks pekerjaan/kode GP.
- Format mata uang Rupiah (`Rp 150.000`).

### 4. Logsheet
- Pemilihan catatan pemeriksaan per tanggal & shift.
- Ringkasan metrics: Total item, Jumlah terisi, dan Belum diisi serta nama petugas piket.
- Filter item pencarian, kelompok item, dan opsi checkbox *"Hanya item terisi"*.
- Tabel pemeriksaan detail dengan status nilai/kondisi atau tampilan JSON.

### 5. Keamanan & Autentikasi
- Sistem login berbasis Supabase Auth dengan cookie sesi terenkripsi (HMAC-SHA256).
- Perlindungan halaman dan API melalui Next.js Middleware.
- Topbar dengan nama akun login dan tombol keluar (*Keluar*).

---

## 🛠️ Cara Menjalankan

### 1. Prasyarat
- Node.js versi 18+ (disarankan Node 20 atau 22+)
- npm atau pnpm

### 2. Konfigurasi Environment (`.env.local`)
File `.env.local` sudah dikonfigurasi dengan kredensial Supabase untuk Engineering, DW, dan Logsheet:
```env
# Supabase Engineering
SUPABASE_URL=https://dwjlkmvcttfokbfjjnfw.supabase.co
SUPABASE_KEY=sb_publishable_NhBQlpPzWLoKFwbhTNF43Q_CSGKRt99
SUPABASE_TABLE=report_eng

# Supabase DW
DW_SUPABASE_URL=https://hgdaqniceqhmijjyyeij.supabase.co
DW_SUPABASE_KEY=...
DW_SUPABASE_TABLE=daily_reports

# Supabase Logsheet
TABLE_SUPABASE_URL=https://eibnrigeisychgfwowrx.supabase.co
TABLE_SUPABASE_KEY=...
TABLE_SUPABASE_TABLES=logsheets

REPORT_TIMEZONE=Asia/Jakarta
SESSION_SECRET=your_secret_key
```

### 3. Menjalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser.

### 4. Build untuk Production
```bash
npm run build
npm run start
```
