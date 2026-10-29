import { NextRequest, NextResponse } from 'next/server';
import { searchPricelist } from '@/lib/pricelist-catalog';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const view = (searchParams.get('view') === 'jasa' ? 'jasa' : 'detail') as 'detail' | 'jasa';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const size = parseInt(searchParams.get('size') || '25', 10);

    const result = searchPricelist(
      q,
      category,
      isNaN(page) ? 1 : page,
      view,
      isNaN(size) ? 25 : size
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mencari pricelist.' },
      { status: 500 }
    );
  }
}
