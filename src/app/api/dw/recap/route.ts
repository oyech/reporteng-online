import { NextRequest } from 'next/server';
import { GET as reportsRecapGet } from '@/app/api/reports/recap/route';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.searchParams.set('source', 'dw');
  const modifiedReq = new NextRequest(url, { headers: req.headers });
  return reportsRecapGet(modifiedReq);
}
