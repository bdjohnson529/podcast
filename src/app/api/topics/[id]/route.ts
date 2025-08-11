import { NextRequest, NextResponse } from 'next/server';
import { createUserClient, getAuthFromRequest } from '@/lib/server-auth';

// GET /api/topics/[id] - fetch a single topic for the current user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, token } = auth;

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    const userClient = createUserClient(token);
    const { data, error } = await userClient
      .from('topics')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json({ topic: data }, { status: 200 });
  } catch (error) {
    console.error('Topic detail GET unexpected error:', error);
    return NextResponse.json({ error: 'Failed to fetch topic' }, { status: 500 });
  }
}

// PATCH /api/topics/[id] - update a topic
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, token } = auth;

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, any> = {};
    if (typeof body?.name === 'string') updates.name = body.name.trim();
    if (typeof body?.description === 'string') updates.description = body.description;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const userClient = createUserClient(token);
    const { data, error } = await userClient
      .from('topics')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
    }

    return NextResponse.json({ topic: data }, { status: 200 });
  } catch (error) {
    console.error('Topic PATCH unexpected error:', error);
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}

// DELETE /api/topics/[id] - delete a topic
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, token } = auth;

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    const userClient = createUserClient(token);
    const { error } = await userClient
      .from('topics')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Topic DELETE unexpected error:', error);
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}

