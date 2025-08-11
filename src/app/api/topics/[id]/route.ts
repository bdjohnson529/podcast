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

// GET /api/topics/[id] - fetch a single topic for the current user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseServiceRole.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseServiceRole.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

