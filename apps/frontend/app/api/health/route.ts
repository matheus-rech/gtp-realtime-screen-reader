import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { status: 'ok' },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      },
    },
  );
}
