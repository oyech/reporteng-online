import fs from 'fs';
import path from 'path';
import { CatalogItem, CatalogResult } from './types';

let cachedItems: CatalogItem[] | null = null;
let cachedSourceCount = 0;
let cachedCodeCount = 0;

export function searchable(val: string): string {
  return val.toLowerCase().replace(/[^\w]+/g, ' ').trim();
}

function getCatalog(): { items: CatalogItem[]; sourceCount: number; codeCount: number } {
  if (cachedItems) {
    return { items: cachedItems, sourceCount: cachedSourceCount, codeCount: cachedCodeCount };
  }

  const filePath = path.join(process.cwd(), 'data', 'items.json');
  if (!fs.existsSync(filePath)) {
    return { items: [], sourceCount: 0, codeCount: 0 };
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const raw = JSON.parse(fileContent);

  const rawList: Array<{ code: string; name: string; satuan?: string }> = raw.items || [];
  cachedSourceCount = rawList.length;

  const pairs: Record<string, { code: string; name: string; satuan: string; count: number }> = {};
  const namesPerCode: Record<string, Set<string>> = {};

  for (const row of rawList) {
    const code = String(row.code || '').trim();
    const name = String(row.name || '').trim();
    const satuan = String(row.satuan || '').trim();
    const key = `${code}||${name}||${satuan}`;

    if (!pairs[key]) {
      pairs[key] = { code, name, satuan, count: 0 };
    }
    pairs[key].count += 1;

    if (!namesPerCode[code]) {
      namesPerCode[code] = new Set();
    }
    namesPerCode[code].add(name);
  }

  cachedCodeCount = Object.keys(namesPerCode).length;

  const items: CatalogItem[] = Object.values(pairs).map((entry) => ({
    code: entry.code,
    name: entry.name,
    satuan: entry.satuan,
    occurrences: entry.count,
    variants: namesPerCode[entry.code] ? namesPerCode[entry.code].size : 1,
    search: searchable(`${entry.code} ${entry.name} ${entry.satuan}`),
  }));

  items.sort((a, b) => {
    const nameCmp = a.name.localeCompare(b.name, 'id');
    if (nameCmp !== 0) return nameCmp;
    return a.code.localeCompare(b.code);
  });

  cachedItems = items;
  return { items: cachedItems, sourceCount: cachedSourceCount, codeCount: cachedCodeCount };
}

export function searchItems(query = '', page = 1, size = 25): CatalogResult {
  const { items, sourceCount, codeCount } = getCatalog();
  const trimmed = query.trim();
  const terms = searchable(trimmed).split(' ').filter(Boolean);

  let found = items;
  if (terms.length > 0) {
    found = items.filter((row) => terms.every((term) => row.search.includes(term)));
  }

  if (trimmed) {
    const exact = trimmed.toLowerCase();
    found.sort((a, b) => {
      const aExact = a.code.toLowerCase() === exact ? 0 : 1;
      const bExact = b.code.toLowerCase() === exact ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const nameCmp = a.name.localeCompare(b.name, 'id');
      if (nameCmp !== 0) return nameCmp;
      return a.code.localeCompare(b.code);
    });
  }

  const pages = Math.max(1, Math.ceil(found.length / size));
  const validPage = Math.min(Math.max(1, page), pages);
  const start = (validPage - 1) * size;
  const pageItems = found.slice(start, start + size);

  return {
    items: pageItems,
    total: found.length,
    page: validPage,
    pages,
    start: found.length > 0 ? start + 1 : 0,
    end: Math.min(start + size, found.length),
    sourceCount,
    codeCount,
    catalogCount: items.length,
  };
}
