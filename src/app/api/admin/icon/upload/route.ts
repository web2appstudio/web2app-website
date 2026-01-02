import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadIcon } from '@/lib/github';

// POST - Upload an icon image to the GitHub repo
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { templateId, imageData } = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Upload the icon to GitHub
    const result = await uploadIcon(templateId, imageData, session.accessToken);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upload icon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      iconUrl: result.iconUrl,
    });
  } catch (error) {
    console.error('Failed to upload icon:', error);
    return NextResponse.json(
      { error: 'Failed to upload icon' },
      { status: 500 }
    );
  }
}
