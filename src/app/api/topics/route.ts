import { NextRequest, NextResponse } from 'next/server';
import { createUserClient, getAuthFromRequest } from '@/lib/server-auth';

// GET /api/topics - list current user's topics
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ topics: [] }, { status: 200 });
    }

    const { user, token } = auth;

    const userClient = createUserClient(token);
    const { data, error } = await userClient
      .from('topics')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Topics GET error:', error);
      return NextResponse.json({ topics: [] }, { status: 200 });
    }

    return NextResponse.json({ topics: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Topics GET unexpected error:', error);
    return NextResponse.json({ topics: [] }, { status: 200 });
  }
}

// POST /api/topics - create a new topic for the current user
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, token } = auth;

    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const description = typeof body?.description === 'string' ? body.description : undefined;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const userClient = createUserClient(token);

    const insertPayload: any = { user_id: user.id, name, description };

    const { data, error } = await userClient
      .from('topics')
      .insert(insertPayload)
      .select('*')
      .single();

    if (!error && data) {
      return NextResponse.json({ topic: data }, { status: 200 });
    }

    console.error('Topics POST error:', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  } catch (error) {
    console.error('Topics POST unexpected error:', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}

