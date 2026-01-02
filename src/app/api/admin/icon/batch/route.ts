import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchManifest, fetchCategoryTemplates, saveTemplate, uploadIcon } from '@/lib/github';
import type { Template } from '@/lib/types';

// POST - Batch fetch and upload icons for all templates
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { dryRun = false } = await request.json().catch(() => ({ dryRun: false }));

    // Fetch the manifest to get all categories
    const manifest = await fetchManifest(session.accessToken);
    if (!manifest) {
      return NextResponse.json({ error: 'Failed to fetch manifest' }, { status: 500 });
    }

    const results: {
      templateId: string;
      name: string;
      category: string;
      status: 'success' | 'failed' | 'skipped';
      message: string;
    }[] = [];

    // Process each category
    for (const category of manifest.categories) {
      const templates = await fetchCategoryTemplates(category.id, session.accessToken);

      for (const template of templates) {
        // Skip templates that already have an icon
        if (template.iconUrl) {
          results.push({
            templateId: template.id,
            name: template.name,
            category: category.id,
            status: 'skipped',
            message: 'Already has icon',
          });
          continue;
        }

        // Try to fetch favicon from the template's URL
        const iconResult = await fetchIconFromUrl(template.url);

        if (!iconResult.success || !iconResult.data) {
          results.push({
            templateId: template.id,
            name: template.name,
            category: category.id,
            status: 'failed',
            message: iconResult.error || 'No icon found',
          });
          continue;
        }

        if (dryRun) {
          results.push({
            templateId: template.id,
            name: template.name,
            category: category.id,
            status: 'success',
            message: 'Would upload icon (dry run)',
          });
          continue;
        }

        // Upload the icon to GitHub
        const uploadResult = await uploadIcon(template.id, iconResult.data, session.accessToken);

        if (!uploadResult.success) {
          results.push({
            templateId: template.id,
            name: template.name,
            category: category.id,
            status: 'failed',
            message: uploadResult.error || 'Failed to upload icon',
          });
          continue;
        }

        // Update the template with the icon URL
        const updatedTemplate: Template = {
          ...template,
          iconUrl: uploadResult.iconUrl,
          iconShape: 'rounded', // Default to rounded for all icons
        };

        const saveResult = await saveTemplate(updatedTemplate, session.accessToken, false);

        if (!saveResult.success) {
          results.push({
            templateId: template.id,
            name: template.name,
            category: category.id,
            status: 'failed',
            message: saveResult.error || 'Failed to save template',
          });
          continue;
        }

        results.push({
          templateId: template.id,
          name: template.name,
          category: category.id,
          status: 'success',
          message: 'Icon uploaded and template updated',
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
      },
      results,
    });
  } catch (error) {
    console.error('Batch icon fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch icon fetch' },
      { status: 500 }
    );
  }
}

// Helper function to fetch icon from a URL
async function fetchIconFromUrl(url: string): Promise<{ success: boolean; data?: string; error?: string }> {
  let host: string;
  try {
    const parsedUrl = new URL(url);
    host = parsedUrl.host;
  } catch {
    return { success: false, error: 'Invalid URL' };
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

        return { success: true, data: dataUrl };
      }
    } catch {
      // Continue to next source
      continue;
    }
  }

  return { success: false, error: 'No icon found' };
}
