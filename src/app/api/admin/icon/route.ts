import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// POST - Fetch favicon from a website URL
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    let host: string;
    try {
      const parsedUrl = new URL(url);
      host = parsedUrl.host;
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    // Try multiple favicon sources in priority order
    const sources = [
      // Apple Touch Icon - highest quality, usually 180x180 or larger
      `https://${host}/apple-touch-icon.png`,
      `https://${host}/apple-touch-icon-precomposed.png`,
      // Common high-res favicon locations
      `https://${host}/favicon-192x192.png`,
      `https://${host}/favicon-128x128.png`,
      // Google Favicon Service - reliable fallback, max 256px
      `https://www.google.com/s2/favicons?domain=${host}&sz=256`,
      // DuckDuckGo Icon Service
      `https://icons.duckduckgo.com/ip3/${host}.ico`,
      // Standard favicon
      `https://${host}/favicon.ico`,
    ];

    for (const source of sources) {
      try {
        const response = await fetch(source, {
          headers: {
            'User-Agent': 'Web2App-Studio-Admin/1.0',
          },
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'image/png';

          // Skip if not an image
          if (!contentType.includes('image')) {
            continue;
          }

          const buffer = await response.arrayBuffer();

          // Skip if too small (likely a placeholder or error)
          if (buffer.byteLength < 100) {
            continue;
          }

          const base64 = Buffer.from(buffer).toString('base64');
          const dataUrl = `data:${contentType};base64,${base64}`;

          return NextResponse.json({
            success: true,
            data: dataUrl,
            source: source,
          });
        }
      } catch {
        // Continue to next source
        continue;
      }
    }

    return NextResponse.json(
      { success: false, error: 'No icon found for this website' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Failed to fetch icon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch icon' },
      { status: 500 }
    );
  }
}
