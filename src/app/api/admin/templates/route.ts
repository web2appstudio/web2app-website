import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  fetchAllTemplates,
  fetchManifest,
  saveTemplate,
  updateTemplateCounts,
} from '@/lib/github';
import type { Template } from '@/lib/types';

// GET - Fetch all templates
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [templates, manifest] = await Promise.all([
      fetchAllTemplates(session.accessToken),
      fetchManifest(session.accessToken),
    ]);

    return NextResponse.json({
      templates,
      categories: manifest?.categories || [],
    });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST - Create a new template
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const template: Template = await request.json();

    // Validate required fields
    if (!template.id || !template.name || !template.url || !template.category) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, url, category' },
        { status: 400 }
      );
    }

    // Ensure metadata has lastUpdated
    template.metadata = {
      ...template.metadata,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    // Save template
    const result = await saveTemplate(template, session.accessToken, true);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create template' },
        { status: 500 }
      );
    }

    // Update manifest template counts
    await updateTemplateCounts(session.accessToken);

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing template
export async function PUT(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const template: Template = await request.json();

    // Validate required fields
    if (!template.id || !template.name || !template.url || !template.category) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, url, category' },
        { status: 400 }
      );
    }

    // Update lastUpdated
    template.metadata = {
      ...template.metadata,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    // Save template
    const result = await saveTemplate(template, session.accessToken, false);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}
