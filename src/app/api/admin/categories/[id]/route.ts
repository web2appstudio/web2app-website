import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchCategory, saveCategory } from '@/lib/github';
import type { Category } from '@/lib/types';

// GET - Fetch a single category by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const category = await fetchCategory(id, session.accessToken);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT - Update a category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const category: Category = await request.json();

    // Ensure the ID matches the URL parameter
    if (category.id !== id) {
      return NextResponse.json(
        { error: 'Category ID mismatch' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!category.id || !category.name) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name' },
        { status: 400 }
      );
    }

    // Save category
    const result = await saveCategory(category, session.accessToken);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Failed to update category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}
