import { NextRequest, NextResponse } from 'next/server';
import { createUserClient, getAuthFromRequest } from '@/lib/server-auth';

export async function PATCH(request: NextRequest) {
  try {
    // Get auth token from header
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, token } = auth;

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
