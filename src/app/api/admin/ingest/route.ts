import { NextRequest, NextResponse } from 'next/server';
import { ingestSource } from '@/lib/ingestion/ingest';

export const maxDuration = 300;

/**
 * POST /api/admin/ingest {source} — trigger a catalog scrape (ADR 0016).
 * Guarded by the INGEST_SECRET header; intended for operators/cron, not users.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.INGEST_SECRET;
  if (!secret || request.headers.get('x-ingest-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { source } = await request.json();
    if (!['amazon', 'cartlow', 'revibe'].includes(source)) {
      return NextResponse.json(
        { error: 'source must be amazon | cartlow | revibe' },
        { status: 400 }
      );
    }
    const result = await ingestSource(source);
    return NextResponse.json(result);
  } catch (error) {
    console.error('ingest failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ingestion failed' },
      { status: 502 }
    );
  }
}
