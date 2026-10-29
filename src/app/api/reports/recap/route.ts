import { NextRequest, NextResponse } from 'next/server';
import { fetchFilteredReports } from '@/lib/reports-service';
import { formatDailyRecap, isShiftReport, areaSortKey } from '@/lib/report-helpers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || '';
    const areaFilter = searchParams.get('area_kerja') || '';
    const title = searchParams.get('title') || '*Tim RM Reguler PIC Tower*';
    const source = (searchParams.get('source') || 'engineering') as 'engineering' | 'dw';

    let targetDate = dateStr;
    if (!targetDate) {
      const now = new Date();
      targetDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`;
    }

    // Fetch reports for this specific date
    const { rows } = await fetchFilteredReports({
      start: targetDate,
      end: targetDate,
      source,
    });

    const nonShiftRows = rows.filter((r) => !isShiftReport(r));
    const filteredRows = areaFilter
      ? nonShiftRows.filter((r) => r.area_kerja === areaFilter)
      : nonShiftRows;

    const textContent = formatDailyRecap(filteredRows, title);

    const areas = Array.from(
      new Set(nonShiftRows.map((r) => String(r.area_kerja || '').trim()).filter(Boolean))
    ).sort((a, b) => {
      const keyA = areaSortKey(a);
      const keyB = areaSortKey(b);
      if (keyA[0] !== keyB[0]) return keyA[0] - keyB[0];
      if (keyA[1] !== keyB[1]) return String(keyA[1]).localeCompare(String(keyB[1]));
      return (keyA[2] || '').localeCompare(keyB[2] || '');
    });

    return NextResponse.json({
      ok: true,
      date: targetDate,
      text: textContent,
      count: filteredRows.length,
      areas,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal membuat rekap harian.' },
      { status: 500 }
    );
  }
}
