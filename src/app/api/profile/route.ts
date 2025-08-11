import { NextRequest, NextResponse } from 'next/server';
import { createUserClient, getAuthFromRequest } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const { user, token } = auth;

    const userClient = createUserClient(token);
    const { data: profile, error } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Profile GET error:', error);
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    return NextResponse.json({ profile: profile ?? null }, { status: 200 });
  } catch (error) {
    console.error('Profile GET unexpected error:', error);
    return NextResponse.json({ profile: null }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, token } = auth;

    const body = await request.json();
    const { company, role, specialization, goal } = body || {};

    const userClient = createUserClient(token);
    const { data: profile, error } = await userClient
      .from('profiles')
      .upsert({ id: user.id, company, role, specialization, goal })
      .select('*')
      .single();

    if (error) {
      console.error('Profile POST error:', error);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('Profile POST unexpected error:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}

