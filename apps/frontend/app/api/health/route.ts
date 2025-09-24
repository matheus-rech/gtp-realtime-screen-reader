import { NextResponse } from 'next/server';

// Only use force-dynamic when not doing static export
if (process.env.STATIC_EXPORT !== 'true') {
  export const dynamic = 'force-dynamic';
}

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
