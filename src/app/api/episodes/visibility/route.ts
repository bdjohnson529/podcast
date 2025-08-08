import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for admin operations
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to create user client
const createUserClient = (token: string) => {
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
  return supabaseUser;
};

export async function PATCH(request: NextRequest) {
  try {
    // Get auth token from header
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
    const { episodeId, visibility } = body;

    if (!episodeId || !visibility || !['private', 'public'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Use user client for RLS compliance
    const userClient = createUserClient(token);

    // Update episode visibility (only owner can update)
    const { data, error } = await userClient
      .from('episodes')
      .update({ visibility })
      .eq('id', episodeId)
      .eq('user_id', user.id) // Ensure only owner can update
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
    }

    return NextResponse.json({ episode: data });

  } catch (error) {
    console.error('Visibility API error:', error);
    return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
  }
}
