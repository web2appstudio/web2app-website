import { NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/auth';

export async function GET() {
  const oauthUrl = getOAuthUrl();
  return NextResponse.redirect(oauthUrl);
}
