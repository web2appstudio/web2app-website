import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST() {
  await destroySession();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${baseUrl}/admin`);
}

export async function GET() {
  await destroySession();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${baseUrl}/admin`);
}
