export interface CatalogItem {
  code: string;
  name: string;
  satuan: string;
  occurrences: number;
  variants: number;
  search: string;
}

export interface CatalogResult {
  items: CatalogItem[];
  total: number;
  page: number;
  pages: number;
  start: number;
  end: number;
  sourceCount: number;
  codeCount: number;
  catalogCount: number;
}

export interface PricelistEntry {
  category: string;
  group?: string;
  parent?: string;
  name: string;
  code?: string;
  service_type?: string;
  type?: string;
  note?: string;
  examples?: string[];
  volume?: number | null;
  unit?: string | null;
  service?: number | null;
  material?: number | null;
  total?: number | null;
  rounded?: number | null;
  row?: number;
  free?: boolean;
  prices?: number[];
  criteria?: string[];
}

export interface PricelistData {
  period: string;
  criteria_notes: Record<string, Record<string, string>>;
  entries: PricelistEntry[];
  rates: PricelistEntry[];
}

export interface PricelistResult {
  rows: PricelistEntry[];
  total: number;
  catalogCount: number;
  categories: string[];
  category: string;
  page: number;
  pages: number;
  start: number;
  end: number;
  period: string;
  criteriaNotes: Record<string, Record<string, string>>;
}

export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'number') {
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
    return formatted.replace(/\s+/g, ' ');
  }
  return String(value);
}
