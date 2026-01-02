import { cookies } from 'next/headers';
import {
  GITHUB_TOKEN_URL,
  GITHUB_API_URL,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS
} from './constants';
import type { GitHubUser, AdminSession } from './types';

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string): Promise<string | null> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('GitHub OAuth credentials not configured');
    return null;
  }

  try {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('OAuth error:', data.error_description);
      return null;
    }

    return data.access_token;
  } catch (error) {
    console.error('Failed to exchange code for token:', error);
    return null;
  }
}

// Fetch GitHub user info
export async function getGitHubUser(accessToken: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Web2App-Studio-Admin',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch GitHub user:', response.status);
      return null;
    }

    const user = await response.json();
    return {
      id: user.id,
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      email: user.email,
    };
  } catch (error) {
    console.error('Failed to fetch GitHub user:', error);
    return null;
  }
}

// Check if user has write access to the templates repo
export async function checkRepoAccess(accessToken: string): Promise<boolean> {
  const org = process.env.GITHUB_ORG || 'web2appstudio';
  const repo = process.env.GITHUB_REPO || 'web2app-templates';

  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${org}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Web2App-Studio-Admin',
      },
    });

    if (!response.ok) {
      return false;
    }

    const repo_data = await response.json();
    // Check if user has push permission
    return repo_data.permissions?.push === true;
  } catch (error) {
    console.error('Failed to check repo access:', error);
    return false;
  }
}

// Encode session data (simple base64 JSON - in production, use proper encryption)
function encodeSession(session: AdminSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

// Decode session data
function decodeSession(encoded: string): AdminSession | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Create a new session
export async function createSession(user: GitHubUser, accessToken: string): Promise<void> {
  const session: AdminSession = {
    user,
    accessToken,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

// Get current session
export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  const session = decodeSession(sessionCookie.value);

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (session.expiresAt < Date.now()) {
    await destroySession();
    return null;
  }

  return session;
}

// Destroy session (logout)
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Generate OAuth authorization URL
export function getOAuthUrl(): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/callback`
    : 'http://localhost:3000/api/admin/callback';

  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    scope: 'repo user:email',
    state: generateState(),
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

// Generate random state for CSRF protection
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
