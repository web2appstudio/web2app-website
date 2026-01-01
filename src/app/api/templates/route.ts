import { NextResponse } from 'next/server';

const GITHUB_ORG = 'web2appstudio';
const GITHUB_REPO = 'web2app-templates';
const GITHUB_BRANCH = 'main';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  const token = process.env.GITHUB_TEMPLATES_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    // If a specific file path is requested, fetch that file
    if (path && path.endsWith('.json')) {
      const fileUrl = `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;

      const response = await fetch(fileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'Web2App-Studio',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Otherwise, fetch the manifest or directory listing
    const manifestUrl = `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/manifest.json?ref=${GITHUB_BRANCH}`;

    const response = await fetch(manifestUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'Web2App-Studio',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Manifest not found' }, { status: 404 });
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const manifest = await response.json();
    return NextResponse.json(manifest);

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// Endpoint to fetch all templates in a category
export async function POST(request: Request) {
  const token = process.env.GITHUB_TEMPLATES_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const { category } = await request.json();

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Fetch directory listing for the category
    const dirUrl = `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/templates/${category}?ref=${GITHUB_BRANCH}`;

    const dirResponse = await fetch(dirUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Web2App-Studio',
      },
      next: { revalidate: 300 },
    });

    if (!dirResponse.ok) {
      if (dirResponse.status === 404) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
      throw new Error(`GitHub API error: ${dirResponse.status}`);
    }

    const files: GitHubFile[] = await dirResponse.json();
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));

    // Fetch all template files in parallel
    const templates = await Promise.all(
      jsonFiles.map(async (file) => {
        const fileResponse = await fetch(file.download_url!, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Web2App-Studio',
          },
        });
        return fileResponse.json();
      })
    );

    return NextResponse.json({ templates });

  } catch (error) {
    console.error('Error fetching category templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
