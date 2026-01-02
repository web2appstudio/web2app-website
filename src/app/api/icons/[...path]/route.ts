import { NextResponse } from 'next/server';

const GITHUB_ORG = 'web2appstudio';
const GITHUB_REPO = 'web2app-templates';
const GITHUB_BRANCH = 'main';

// GET - Serve icon images from the private GitHub repo
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const iconPath = path.join('/');
  const token = process.env.GITHUB_TEMPLATES_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/${iconPath}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'Web2App-Studio',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Icon not found' }, { status: 404 });
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();

    // Determine content type based on file extension
    let contentType = 'image/png';
    if (iconPath.endsWith('.jpg') || iconPath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (iconPath.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (iconPath.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (iconPath.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    }

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching icon:', error);
    return NextResponse.json({ error: 'Failed to fetch icon' }, { status: 500 });
  }
}
