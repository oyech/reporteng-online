export interface LogsheetRow {
  id?: string | number;
  log_key: string;
  log_date: string;
  shift?: string;
  payload?: Record<string, any>;
  created_at?: string;
  [key: string]: any;
}

export interface LogItem {
  group: string;
  name: string;
  value: any;
  fullName: string;
  filled: boolean;
}

export interface LogsheetContext {
  selectedLog: LogsheetRow | null;
  logItems: LogItem[];
  logGroups: string[];
  itemCount: number;
  filledCount: number;
  logQuery: string;
  logGroup: string;
  filledOnly: boolean;
  payloadValid: boolean;
  personnel: string[];
}

export async function fetchLogsheetRows(page = 1, pageSize = 50): Promise<{ rows: LogsheetRow[]; total: number | null }> {
  const url = (process.env.TABLE_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.TABLE_SUPABASE_KEY || '';
  const table = 'logsheets';

  if (!url || !key) {
    throw new Error('TABLE_SUPABASE_URL atau TABLE_SUPABASE_KEY belum dikonfigurasi di .env.');
  }

  const offset = (page - 1) * pageSize;
  const targetUrl = `${url}/rest/v1/${table}?select=*&limit=${pageSize}&offset=${offset}&order=log_date.desc,log_key.asc`;

  const res = await fetch(targetUrl, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Supabase gagal memuat logsheets (HTTP ${res.status}).`);
  }

  const rows: LogsheetRow[] = await res.json();
  const contentRange = res.headers.get('content-range') || '';
  const rawTotal = contentRange.split('/').pop();
  const total = rawTotal && /^\d+$/.test(rawTotal) ? parseInt(rawTotal, 10) : null;

  return { rows, total };
}

export function buildLogsheetContext(
  rows: LogsheetRow[],
  selectedKey?: string,
  query = '',
  selectedGroup = '',
  filledOnly = false
): LogsheetContext {
  let selectedLog: LogsheetRow | null = null;
  if (selectedKey) {
    selectedLog = rows.find((r) => String(r.log_key) === selectedKey) || null;
  }
  if (!selectedLog && rows.length > 0) {
    selectedLog = rows[0];
  }

  const payload = selectedLog?.payload;
  const metadataKeys = new Set(['Tanggal', 'Shift', 'Petugas 1', 'Petugas 2', 'Petugas 3']);
  const items: LogItem[] = [];

  if (payload && typeof payload === 'object') {
    for (const [name, value] of Object.entries(payload)) {
      if (metadataKeys.has(name)) continue;

      let group = 'Umum';
      let label = name;
      const sepIndex = name.indexOf(' - ');
      if (sepIndex !== -1) {
        group = name.slice(0, sepIndex);
        label = name.slice(sepIndex + 3);
      }

      const isFilled = value !== null && value !== undefined && value !== '';
      items.push({
        group,
        name: label,
        value,
        fullName: name,
        filled: isFilled,
      });
    }
  }

  const groupsSet = new Set(items.map((i) => i.group));
  const logGroups = Array.from(groupsSet).sort((a, b) => a.localeCompare(b, 'id'));

  const trimmedQuery = query.trim().toLowerCase();
  const visible = items.filter((item) => {
    if (selectedGroup && item.group !== selectedGroup) return false;
    if (filledOnly && !item.filled) return false;
    if (trimmedQuery && !item.fullName.toLowerCase().includes(trimmedQuery)) return false;
    return true;
  });

  visible.sort((a, b) => {
    const grp = a.group.localeCompare(b.group, 'id');
    if (grp !== 0) return grp;
    return a.name.localeCompare(b.name, 'id');
  });

  const personnel: string[] = [];
  if (payload && typeof payload === 'object') {
    for (const p of ['Petugas 1', 'Petugas 2', 'Petugas 3']) {
      const val = payload[p];
      if (val !== null && val !== undefined && val !== '') {
        personnel.push(String(val));
      }
    }
  }

  return {
    selectedLog,
    logItems: visible,
    logGroups,
    itemCount: items.length,
    filledCount: items.filter((i) => i.filled).length,
    logQuery: query,
    logGroup: selectedGroup,
    filledOnly,
    payloadValid: Boolean(payload && typeof payload === 'object'),
    personnel,
  };
}
