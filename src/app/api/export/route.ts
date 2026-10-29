import { NextRequest, NextResponse } from 'next/server';
import { fetchFilteredReports } from '@/lib/reports-service';
import { generateExcelBuffer } from '@/lib/report-helpers';

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
    const source = (searchParams.get('source') || 'engineering') as 'engineering' | 'dw';

    const { rows } = await fetchFilteredReports({
      start,
      end,
      area_kerja,
      unit_area,
      status,
      pic,
      q,
      source,
    });

    const isDw = source === 'dw';
    const excelBuffer = generateExcelBuffer(rows, isDw);

    const filename = `${isDw ? 'laporan_dw' : 'laporan'}_${start || 'semua'}_${end || 'terbaru'}.xlsx`;

    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengekspor laporan ke Excel.' },
      { status: 500 }
    );
  }
}
