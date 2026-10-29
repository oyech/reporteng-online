import { NextRequest, NextResponse } from 'next/server';
import { searchItems } from '@/lib/items-catalog';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const size = parseInt(searchParams.get('size') || '25', 10);

    const result = searchItems(q, isNaN(page) ? 1 : page, isNaN(size) ? 25 : size);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mencari kode item.' },
      { status: 500 }
    );
  }
}
