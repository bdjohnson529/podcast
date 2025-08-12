import { NextRequest, NextResponse } from 'next/server';
import { createUserClient, getAuthFromRequest } from '@/lib/server-auth';

function isValidHttpUrl(u: unknown): boolean {
  if (typeof u !== 'string') return false;
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// GET /api/topics/[id]/feeds - list feeds under a topic (owned by current user via RLS)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ feeds: [] }, { status: 200 });
    }
    const { user, token } = auth;

    const topicId = params.id;
    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    const userClient = createUserClient(token);
    const { data, error } = await userClient
      .from('feeds')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Topic feeds GET error:', error);
      return NextResponse.json({ feeds: [] }, { status: 200 });
    }

    return NextResponse.json({ feeds: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Topic feeds GET unexpected error:', error);
    return NextResponse.json({ feeds: [] }, { status: 200 });
  }
}

// POST /api/topics/[id]/feeds - create a new feed under a topic
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, token } = auth;

    const topicId = params.id;
    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
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

    // Insert feed scoped to topic; RLS ensures the topic belongs to the user
    const insertPayload: any = { topic_id: topicId, name, description };
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

    // Handle duplicate per-topic feed_url
    const pgErr = error as any;
    const code = pgErr?.code || pgErr?.details?.code;
    if (code === '23505' && feed_url) {
      const { data: existing } = await userClient
        .from('feeds')
        .select('*')
        .eq('topic_id', topicId)
        .eq('feed_url', feed_url)
        .single();
      if (existing) {
        return NextResponse.json({ feed: existing, duplicate: true }, { status: 200 });
      }
    }

    console.error('Topic feeds POST error:', error);
    return NextResponse.json({ error: 'Failed to create feed' }, { status: 500 });
  } catch (error) {
    console.error('Topic feeds POST unexpected error:', error);
    return NextResponse.json({ error: 'Failed to create feed' }, { status: 500 });
  }
}

