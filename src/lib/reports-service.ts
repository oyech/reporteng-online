import { getSession } from './auth';
import { normalizeReport, ReportItem, FilterOptions, FIELDS } from './report-helpers';

export interface FetchReportsParams {
  start?: string;
  end?: string;
  area_kerja?: string;
  unit_area?: string;
  status?: string;
  pic?: string;
  q?: string;
  source?: 'engineering' | 'dw';
}

const DEFAULTS = {
  engineering: {
    url: 'https://dwjlkmvcttfokbfjjnfw.supabase.co',
    key: 'sb_publishable_NhBQlpPzWLoKFwbhTNF43Q_CSGKRt99',
    table: 'report_eng',
  },
  dw: {
    url: 'https://hgdaqniceqhmijjyyeij.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZGFxbmljZXFobWlqanl5ZWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODgwMzMsImV4cCI6MjEwMjg2NDAzM30.v39UoUgDhLMRbRHaK9sSGYiRzpSljwSpksjj9vdowh8',
    table: 'daily_reports',
  },
};

export async function fetchFilteredReports(params: FetchReportsParams) {
  const source = params.source || 'engineering';
  const isDw = source === 'dw';

  const defaultConf = isDw ? DEFAULTS.dw : DEFAULTS.engineering;
  const prefix = isDw ? 'DW_' : '';
  const url = (process.env[`${prefix}SUPABASE_URL`] || defaultConf.url).replace(/\/$/, '');
  const key = process.env[`${prefix}SUPABASE_KEY`] || defaultConf.key;
  const table = process.env[`${prefix}SUPABASE_TABLE`] || defaultConf.table;

  if (!url || !key || !table) {
    throw new Error(`Konfigurasi Supabase untuk ${source} belum lengkap pada .env.`);
  }

  const session = await getSession();

  if (!isDw && !session?.token) {
    throw new Error('Sesi login belum ditemukan atau telah berakhir. Silakan login dengan akun Engineering / SPV.');
  }

  const token = isDw ? key : session?.token || key;

  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const areaColumn = isDw ? 'title' : 'area_kerja';
  const queryParams = new URLSearchParams();
  queryParams.set('select', `id,created_at,created_date,pic,${areaColumn},report_items`);
  queryParams.set('order', 'created_at.desc,id.desc');

  // Convert start/end date (in Asia/Jakarta, UTC+7) to UTC
  if (params.start) {
    // 00:00:00 WIB is 17:00:00 UTC previous day
    const startDate = new Date(`${params.start}T00:00:00+07:00`);
    if (!isNaN(startDate.getTime())) {
      queryParams.set('created_at', `gte.${startDate.toISOString()}`);
    }
  }

  if (params.end) {
    // End date until 23:59:59.999 WIB, which is next day 00:00:00 WIB
    const endDate = new Date(`${params.end}T00:00:00+07:00`);
    if (!isNaN(endDate.getTime())) {
      endDate.setDate(endDate.getDate() + 1);
      const nextDayUtc = endDate.toISOString();
      if (params.start) {
        // Supabase PostgREST allows multiple created_at params, or and=(created_at.gte...,created_at.lt...)
        // In fetch URL: created_at=gte.X&created_at=lt.Y
      }
    }
  }

  let rawQueryString = queryParams.toString();
  if (params.end) {
    const endDate = new Date(`${params.end}T00:00:00+07:00`);
    if (!isNaN(endDate.getTime())) {
      endDate.setDate(endDate.getDate() + 1);
      rawQueryString += `&created_at=lt.${endDate.toISOString()}`;
    }
  }

  const allRawRows: any[] = [];
  const limit = 1000;
  let offset = 0;

  while (true) {
    const fetchUrl = `${url}/rest/v1/${table}?${rawQueryString}&limit=${limit}&offset=${offset}`;
    const res = await fetch(fetchUrl, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          isDw
            ? 'Supabase DW menolak akses. Periksa DW_SUPABASE_KEY dan izin SELECT.'
            : 'Akun Anda tidak memiliki izin untuk membaca laporan pekerjaan di tabel ini. Pastikan akun memiliki role SPV atau Admin, atau area kerja yang sesuai.'
        );
      }
      throw new Error(`Gagal memuat data dari Supabase (HTTP ${res.status}).`);
    }

    const batch = await res.json();
    if (!Array.isArray(batch)) {
      throw new Error('Format data dari Supabase tidak valid.');
    }

    if (batch.length === 0) break;
    allRawRows.push(...batch);

    if (batch.length < limit || allRawRows.length >= 50000) {
      break;
    }
    offset += limit;
  }

  let normalized: ReportItem[] = [];
  for (const row of allRawRows) {
    normalized.push(...normalizeReport(row, source));
  }

  // Extract filter dropdown options before applying client-side dropdown filters
  const options: FilterOptions = {
    area_kerja: Array.from(new Set(normalized.map((r) => r.area_kerja).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'id')
    ),
    unit_area: Array.from(new Set(normalized.map((r) => r.unit_area).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'id')
    ),
    status: Array.from(new Set(normalized.map((r) => r.status).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'id')
    ),
    pic: Array.from(new Set(normalized.map((r) => r.pic).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'id')
    ),
  };

  // Filter by area_kerja, unit_area, status, pic
  if (params.area_kerja) {
    normalized = normalized.filter((r) => r.area_kerja === params.area_kerja);
  }
  if (params.unit_area) {
    normalized = normalized.filter((r) => r.unit_area === params.unit_area);
  }
  if (params.status) {
    normalized = normalized.filter((r) => r.status === params.status);
  }
  if (params.pic) {
    normalized = normalized.filter((r) => r.pic === params.pic);
  }

  // Filter by text search query q
  if (params.q) {
    const qLower = params.q.trim().toLowerCase();
    normalized = normalized.filter((r) => {
      const combined = `${r.tanggal} ${r.area_kerja} ${r.unit_area} ${r.pekerjaan} ${r.status} ${r.pic}`.toLowerCase();
      return combined.includes(qLower);
    });
  }

  return {
    rows: normalized,
    options,
    total: normalized.length,
  };
}
