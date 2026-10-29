import * as XLSX from 'xlsx';

export interface ReportItem {
  id: string | number;
  tanggal: string; // ISO in WIB (UTC+7)
  area_kerja: string;
  unit_area: string;
  pekerjaan: string;
  status: string;
  pic: string;
  foto: string[];
}

export interface FilterOptions {
  area_kerja: string[];
  unit_area: string[];
  status: string[];
  pic: string[];
}

export const ITEM_ALIASES = {
  unit_area: ['unit_area', 'unit', 'area', 'unit_name', 'location'],
  pekerjaan: ['pekerjaan', 'description', 'job', 'work', 'deskripsi', 'activity'],
  status: ['status'],
  foto: ['foto', 'photos', 'photo', 'photo_url', 'photo_urls', 'images', 'image_url', 'imagepaths'],
};

export const FIELDS = ['tanggal', 'area_kerja', 'unit_area', 'pekerjaan', 'status', 'pic', 'foto'] as const;
export const HEADERS = ['Tanggal & Waktu (UTC+7)', 'Area Kerja', 'Unit/Area', 'Pekerjaan', 'Status', 'PIC', 'Foto'];

export function keyName(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function photoUrls(val: any): string[] {
  if (!val) return [];
  if (typeof val === 'object' && !Array.isArray(val)) {
    val = val.url || val.publicUrl || '';
  }
  if (typeof val === 'string') {
    val = [val];
  }
  if (!Array.isArray(val)) return [];

  const urls: string[] = [];
  for (const item of val) {
    let urlStr = '';
    if (typeof item === 'object' && item !== null) {
      urlStr = item.url || item.publicUrl || '';
    } else if (typeof item === 'string') {
      urlStr = item;
    }
    if (urlStr && /^https?:\/\/.+/i.test(urlStr)) {
      urls.push(urlStr);
    }
  }
  return urls;
}

export function picValue(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') {
    return val;
  }
  if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
    return String(val.pic || val.name || val.email || '');
  }
  if (Array.isArray(val)) {
    const parts: string[] = [];
    for (const item of val) {
      if (typeof item === 'object' && item !== null) {
        const p = item.pic || item.name || item.email || '';
        if (p) parts.push(String(p).trim());
      } else if (item) {
        parts.push(String(item).trim());
      }
    }
    return parts.join('|');
  }
  return String(val);
}

export function toJakartaISO(rawDateStr: string | null | undefined): string {
  if (!rawDateStr) return '';
  let str = String(rawDateStr).trim();
  if (str.endsWith('Z')) {
    str = str.slice(0, -1) + '+00:00';
  }
  // Standardize fractional seconds
  str = str.replace(/(T\d{2}:\d{2}:\d{2})\.(\d+)/, (_, timePart, frac) => {
    return `${timePart}.${frac.slice(0, 6).padEnd(6, '0')}`;
  });

  const date = new Date(str);
  if (isNaN(date.getTime())) {
    return String(rawDateStr);
  }

  // Convert UTC to Asia/Jakarta (UTC+7)
  const jakartaOffsetMs = 7 * 60 * 60 * 1000;
  const localTime = new Date(date.getTime() + jakartaOffsetMs);

  const Y = localTime.getUTCFullYear();
  const M = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const D = String(localTime.getUTCDate()).padStart(2, '0');
  const h = String(localTime.getUTCHours()).padStart(2, '0');
  const m = String(localTime.getUTCMinutes()).padStart(2, '0');
  const s = String(localTime.getUTCSeconds()).padStart(2, '0');

  return `${Y}-${M}-${D}T${h}:${m}:${s}+07:00`;
}

export function normalizeReport(row: any, source: 'engineering' | 'dw' = 'engineering'): ReportItem[] {
  const items = row.report_items;
  if (!Array.isArray(items)) {
    return [];
  }

  const rawTs = row.created_at || row.created_date;
  const reportDatetime = toJakartaISO(rawTs);
  const areaKerja = String(source === 'dw' ? (row.title || row.area_kerja || '') : (row.area_kerja || ''));
  const pic = picValue(row.pic);

  const records: ReportItem[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    const keys: Record<string, any> = {};
    for (const [k, v] of Object.entries(item)) {
      keys[keyName(k)] = v;
    }

    const record: ReportItem = {
      id: row.id,
      tanggal: reportDatetime,
      area_kerja: areaKerja,
      pic,
      unit_area: '',
      pekerjaan: '',
      status: '',
      foto: [],
    };

    for (const [field, aliases] of Object.entries(ITEM_ALIASES)) {
      let value: any = undefined;
      for (const candidate of aliases) {
        const k = keyName(candidate);
        if (k in keys) {
          value = keys[k];
          break;
        }
      }

      if (field === 'foto') {
        record.foto = photoUrls(value);
      } else if (field === 'status') {
        let statusStr = value !== undefined && value !== null ? String(value).trim() : '';
        if (statusStr.startsWith('ProgressStatus.')) {
          statusStr = statusStr.replace('ProgressStatus.', '');
        } else if (statusStr === 'ProgressStatus') {
          statusStr = '';
        }
        record.status = statusStr;
      } else if (field === 'unit_area') {
        record.unit_area = value !== undefined && value !== null ? String(value).trim() : '';
      } else if (field === 'pekerjaan') {
        record.pekerjaan = value !== undefined && value !== null ? String(value).trim() : '';
      }
    }

    records.push(record);
  }

  return records;
}

export function formatUnitArea(value: string): string {
  const text = String(value || '').trim();
  if (!text) return '—';
  const m = /^([a-zA-Z]{1,8})[\s-]*(\d+[a-zA-Z]?)$/.exec(text);
  if (m) {
    return `${m[1].toUpperCase()}-${m[2].toUpperCase()}`;
  }
  return text.toLowerCase().replace(/(^|[\s/()\-–])([a-zA-Z])/g, (_, sep, letter) => sep + letter.toUpperCase()) || '—';
}

export function formatReportItem(
  report: { unit_area?: string; area_kerja?: string; pekerjaan?: string; status?: string },
  options: { flatten?: boolean } = {}
) {
  const rawUnit = String(report.unit_area || report.area_kerja || '').trim();
  const unit = rawUnit ? formatUnitArea(rawUnit) : '';
  let description = String(report.pekerjaan || '').trim();

  if (options.flatten) {
    description = description
      .split(/[\r\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' - ');
  }

  if (unit && unit !== '—') {
    const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '[-\\s]?');
    const unitRegex = new RegExp(`^${escapedUnit}\\s*[-:]?\\s*`, 'i');
    if (unitRegex.test(description)) {
      description = description.replace(unitRegex, '').trim();
    }
  }

  let statusText = report.status ? String(report.status).replace(/^ProgressStatus\./, '').trim() : '';
  if (statusText) {
    const escapedStatus = statusText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const statusEndRegex = new RegExp(`\\s*\\(${escapedStatus}\\)\\.?\\s*$`, 'i');
    description = description.replace(statusEndRegex, '').trim();
  }
  description = description.replace(/\s*\((done|berlanjut|pending|selesai|proses|dalam proses)\)\.?\s*$/i, '').trim();

  const capitalizedDescription = description
    ? description[0].toUpperCase() + description.slice(1)
    : unit && unit !== '—'
    ? ''
    : '—';

  return { unit, capitalizedDescription, statusText };
}

export function formatReportItemText(r: ReportItem): string {
  const { unit, capitalizedDescription, statusText } = formatReportItem(r, { flatten: true });
  const parts: string[] = [];
  if (unit && unit !== '—') parts.push(unit);
  if (capitalizedDescription) parts.push(capitalizedDescription);
  let line = parts.join(' ').trim();
  if (statusText) {
    line = `${line} (${statusText})`;
  }
  return line;
}

export function isShiftArea(value: string): boolean {
  const text = String(value || '').trim();
  return /\bshift\b/i.test(text);
}

export function isShiftReport(r: ReportItem): boolean {
  const area = String(r.area_kerja || '').trim();
  const unit = String(r.unit_area || '').trim();
  return isShiftArea(area) || /^\s*shift\b/i.test(unit);
}

export function areaSortKey(area: string): [number, string, string] | [number, string] {
  const areaClean = String(area || '').trim();
  const areaLower = areaClean.toLowerCase();

  // Priority 0: Tower
  if (/\btower\b/.test(areaLower)) {
    const m = /\btower\s+([a-z0-9]+)/.exec(areaLower);
    let subKey = m ? m[1] : areaLower;
    if (/^\d+$/.test(subKey)) {
      subKey = subKey.padStart(5, '0');
    }
    return [0, subKey, areaLower];
  }

  // Priority 1: Public Area
  if (/\b(publi[ck]|pabli[ck])\b/.test(areaLower) || areaLower.includes('public') || areaLower.includes('publik')) {
    return [1, areaLower];
  }

  // Priority 2: Others
  return [2, areaLower];
}

export function formatDailyRecap(rows: ReportItem[], title = '*Tim RM Reguler PIC Tower*'): string {
  let cleanTitle = (title || '').trim();
  if (cleanTitle && !(cleanTitle.startsWith('*') && cleanTitle.endsWith('*'))) {
    cleanTitle = `*${cleanTitle}*`;
  }

  const validRows = (rows || []).filter((r) => !isShiftReport(r));

  if (validRows.length === 0) {
    const header = cleanTitle ? `${cleanTitle}\n\n` : '';
    return `${header}(Tidak ada pekerjaan pada tanggal ini)`;
  }

  // Group by area_kerja
  const groups: Record<string, ReportItem[]> = {};
  for (const r of validRows) {
    const area = String(r.area_kerja || '').trim() || 'Area Lainnya';
    if (!groups[area]) groups[area] = [];
    groups[area].push(r);
  }

  const sortedAreas = Object.keys(groups).sort((a, b) => {
    const keyA = areaSortKey(a);
    const keyB = areaSortKey(b);
    if (keyA[0] !== keyB[0]) return keyA[0] - keyB[0];
    if (keyA[1] !== keyB[1]) return String(keyA[1]).localeCompare(String(keyB[1]));
    return (keyA[2] || '').localeCompare(keyB[2] || '');
  });

  const sections: string[] = [];
  if (cleanTitle) {
    sections.push(cleanTitle);
  }

  for (const area of sortedAreas) {
    const areaHeading = !(area.startsWith('*') && area.endsWith('*')) ? `*${area}*` : area;
    const lines = [areaHeading];
    for (const r of groups[area]) {
      const itemText = formatReportItemText(r);
      lines.push(`• ${itemText}`);
    }
    sections.push(lines.join('\n'));
  }

  return sections.join('\n\n');
}

export function generateExcelBuffer(rows: ReportItem[], isDw = false): Buffer {
  const sheetTitle = isDw ? 'Laporan DW' : 'Laporan Pekerjaan';

  const sheetData = [
    HEADERS,
    ...rows.map((r) => [
      r.tanggal.replace('T', ' ').slice(0, 19),
      r.area_kerja || '—',
      r.unit_area || '—',
      r.pekerjaan || '—',
      r.status || '—',
      r.pic || '—',
      r.foto.length > 0 ? r.foto.join('\n') : '',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 24 }, // Tanggal
    { wch: 22 }, // Area Kerja
    { wch: 20 }, // Unit/Area
    { wch: 60 }, // Pekerjaan
    { wch: 18 }, // Status
    { wch: 20 }, // PIC
    { wch: 45 }, // Foto
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
