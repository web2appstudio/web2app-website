import { NextResponse } from 'next/server';
import { fetchCategoriesPublic } from '@/lib/github';

// GET - Public endpoint to fetch all categories with configurations
// Used by the desktop app to sync category defaults
export async function GET() {
  try {
    const categories = await fetchCategoriesPublic();

    // Return with version info for cache validation
    const response = {
      version: '2.0.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      categories,
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 5 minutes on CDN, allow stale for 1 hour while revalidating
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
