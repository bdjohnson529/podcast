import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for privileged auth lookups
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to create a RLS-respecting user client with a bearer token
const createUserClient = (token: string) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
};

// GET /api/feeds - list current user's feeds
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ feeds: [] }, { status: 200 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseServiceRole.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ feeds: [] }, { status: 200 });
    }

    const userClient = createUserClient(token);
    const { data, error } = await userClient
      .from('feeds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Feeds GET error:', error);
      return NextResponse.json({ feeds: [] }, { status: 200 });
    }

    return NextResponse.json({ feeds: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Feeds GET unexpected error:', error);
    return NextResponse.json({ feeds: [] }, { status: 200 });
  }
}

// POST /api/feeds - create a new feed for the current user
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseServiceRole.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body || {};

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const userClient = createUserClient(token);
    const { data, error } = await userClient
      .from('feeds')
      .insert({ user_id: user.id, name, description })
      .select('*')
      .single();

    if (error) {
      console.error('Feeds POST error:', error);
      return NextResponse.json({ error: 'Failed to create feed' }, { status: 500 });
    }

    return NextResponse.json({ feed: data }, { status: 200 });
  } catch (error) {
    console.error('Feeds POST unexpected error:', error);
    return NextResponse.json({ error: 'Failed to create feed' }, { status: 500 });
  }
}

