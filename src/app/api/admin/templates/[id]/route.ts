import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchTemplate, deleteTemplate, updateTemplateCounts } from '@/lib/github';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch a single template
export async function GET(request: Request, { params }: RouteParams) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (!category) {
    return NextResponse.json(
      { error: 'Category parameter is required' },
      { status: 400 }
    );
  }

  try {
    const template = await fetchTemplate(id, category, session.accessToken);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (!category) {
    return NextResponse.json(
      { error: 'Category parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await deleteTemplate(id, category, session.accessToken);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete template' },
        { status: 500 }
      );
    }

    // Update manifest template counts
    await updateTemplateCounts(session.accessToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
