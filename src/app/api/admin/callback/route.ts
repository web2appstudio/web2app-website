import { NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  getGitHubUser,
  checkRepoAccess,
  createSession,
} from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/admin?error=${encodeURIComponent(error)}`
    );
  }

  // Validate code
  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/admin?error=${encodeURIComponent('No authorization code received')}`
    );
  }

  // Exchange code for access token
  const accessToken = await exchangeCodeForToken(code);
  if (!accessToken) {
    return NextResponse.redirect(
      `${baseUrl}/admin?error=${encodeURIComponent('Failed to authenticate with GitHub')}`
    );
  }

  // Get user info
  const user = await getGitHubUser(accessToken);
  if (!user) {
    return NextResponse.redirect(
      `${baseUrl}/admin?error=${encodeURIComponent('Failed to get user information')}`
    );
  }

  // Check if user has write access to the templates repo
  const hasAccess = await checkRepoAccess(accessToken);
  if (!hasAccess) {
    return NextResponse.redirect(
      `${baseUrl}/admin?error=${encodeURIComponent('You do not have write access to the templates repository')}`
    );
  }

  // Create session
  await createSession(user, accessToken);

  // Redirect to admin dashboard
  return NextResponse.redirect(`${baseUrl}/admin/dashboard`);
}
