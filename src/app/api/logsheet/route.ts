import { NextRequest, NextResponse } from 'next/server';
import { fetchLogsheetRows, buildLogsheetContext } from '@/lib/logsheet-helpers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const selectedKey = searchParams.get('log') || undefined;
    const q = searchParams.get('q') || '';
    const group = searchParams.get('group') || '';
    const filledOnly = searchParams.get('filled') === '1';

    const { rows, total } = await fetchLogsheetRows(isNaN(page) ? 1 : page, 50);
    const context = buildLogsheetContext(rows, selectedKey, q, group, filledOnly);

    return NextResponse.json({
      rows,
      total,
      page: isNaN(page) ? 1 : page,
      pageSize: 50,
      ...context,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal memuat logsheet.' },
      { status: 500 }
    );
  }
}
