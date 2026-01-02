import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchAllCategories } from '@/lib/github';

// GET - Fetch all categories with configurations
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categories = await fetchAllCategories(session.accessToken);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
