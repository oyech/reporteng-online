import fs from 'fs';
import path from 'path';
import { searchable } from './items-catalog';
import { PricelistEntry, PricelistData, PricelistResult, formatPrice } from './types';

export { formatPrice };

let cachedData: PricelistData | null = null;

export function getPricelistData(): PricelistData {
  if (cachedData) return cachedData;

  const filePath = path.join(process.cwd(), 'data', 'pricelist.json');
  if (!fs.existsSync(filePath)) {
    return {
      period: '—',
      criteria_notes: {},
      entries: [],
      rates: [],
    };
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedData = JSON.parse(raw);
  return cachedData!;
}

export function searchPricelist(
  query = '',
  category = '',
  page = 1,
  view: 'detail' | 'jasa' = 'detail',
  size = 25
): PricelistResult {
  const data = getPricelistData();
  const allRows: PricelistEntry[] = view === 'jasa' ? data.rates : data.entries;
  const categories: string[] = Array.from(
    new Set(allRows.map((r: PricelistEntry) => r.category).filter(Boolean))
  ) as string[];

  const validCategory = categories.includes(category) ? category : '';
  const trimmed = query.trim();
  const terms = searchable(trimmed).split(' ').filter(Boolean);

  const exactCode = trimmed
    ? allRows.some((r: PricelistEntry) => String(r.code || '').toLowerCase() === trimmed.toLowerCase())
    : false;

  const found: PricelistEntry[] = allRows.filter((row: PricelistEntry) => {
    if (validCategory && row.category !== validCategory) {
      return false;
    }
    if (exactCode) {
      return String(row.code || '').toLowerCase() === trimmed.toLowerCase();
    }
    if (terms.length > 0) {
      const rowSearchText = searchable(
        [
          row.category,
          row.group,
          row.parent,
          row.name,
          row.code,
          row.service_type,
          row.type,
          row.note,
          ...(row.examples || []),
        ]
          .filter(Boolean)
          .join(' ')
      );
      return terms.every((t) => rowSearchText.includes(t));
    }
    return true;
  });

  const pages = Math.max(1, Math.ceil(found.length / size));
  const validPage = Math.min(Math.max(1, page), pages);
  const start = (validPage - 1) * size;
  const pageRows = found.slice(start, start + size);

  return {
    rows: pageRows,
    total: found.length,
    catalogCount: allRows.length,
    categories,
    category: validCategory,
    page: validPage,
    pages,
    start: found.length > 0 ? start + 1 : 0,
    end: Math.min(start + size, found.length),
    period: data.period || 'April 2019–Maret 2020',
    criteriaNotes: data.criteria_notes || {},
  };
}
