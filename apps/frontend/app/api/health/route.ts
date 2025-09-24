import { NextResponse } from 'next/server';

// Only use force-dynamic when not doing static export
export const dynamic = process.env.STATIC_EXPORT !== 'true' ? 'force-dynamic' : undefined;

export function GET() {
  return NextResponse.json(
    { status: 'ok' },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
