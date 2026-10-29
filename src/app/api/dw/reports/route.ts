import { NextRequest, NextResponse } from 'next/server';
import { fetchFilteredReports } from '@/lib/reports-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start') || undefined;
    const end = searchParams.get('end') || undefined;
    const area_kerja = searchParams.get('area_kerja') || undefined;
    const unit_area = searchParams.get('unit_area') || undefined;
    const status = searchParams.get('status') || undefined;
    const pic = searchParams.get('pic') || undefined;
    const q = searchParams.get('q') || undefined;

    const data = await fetchFilteredReports({
      start,
      end,
      area_kerja,
      unit_area,
      status,
      pic,
      q,
      source: 'dw',
    });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil laporan DW.' },
      { status: 500 }
    );
  }
}
