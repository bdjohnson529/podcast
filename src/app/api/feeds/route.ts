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

function isValidHttpUrl(u: unknown): boolean {
  if (typeof u !== 'string') return false;
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

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

    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const description = typeof body?.description === 'string' ? body.description : undefined;
    const feed_url = typeof body?.feed_url === 'string' ? body.feed_url.trim() : undefined;
    const site_url = typeof body?.site_url === 'string' ? body.site_url.trim() : undefined;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (feed_url !== undefined && !isValidHttpUrl(feed_url)) {
      return NextResponse.json({ error: 'feed_url must be a valid http(s) URL' }, { status: 400 });
    }
    if (site_url !== undefined && !isValidHttpUrl(site_url)) {
      return NextResponse.json({ error: 'site_url must be a valid http(s) URL' }, { status: 400 });
    }

    const userClient = createUserClient(token);

    // Try to insert. If a unique violation occurs for (user_id, feed_url), fetch the existing row and return it.
    const insertPayload: any = { user_id: user.id, name, description };
    if (feed_url) insertPayload.feed_url = feed_url;
    if (site_url) insertPayload.site_url = site_url;

    const { data, error } = await userClient
      .from('feeds')
      .insert(insertPayload)
      .select('*')
      .single();

    if (!error && data) {
      return NextResponse.json({ feed: data }, { status: 200 });
    }

    // If duplicate
    const pgErr = error as any;
    const code = pgErr?.code || pgErr?.details?.code;
    if (code === '23505' && feed_url) {
      const { data: existing } = await userClient
        .from('feeds')
        .select('*')
        .eq('user_id', user.id)
        .eq('feed_url', feed_url)
        .single();
      if (existing) {
        return NextResponse.json({ feed: existing, duplicate: true }, { status: 200 });
      }
    }

    console.error('Feeds POST error:', error);
    return NextResponse.json({ error: 'Failed to create feed' }, { status: 500 });
  } catch (error) {
    console.error('Feeds POST unexpected error:', error);
    return NextResponse.json({ error: 'Failed to create feed' }, { status: 500 });
  }
}

