import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for admin operations
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const episodeId = params.id;

    if (!episodeId) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }

    // Fetch public episode
    const { data: episode, error } = await supabaseServiceRole
      .from('episodes')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('id', episodeId)
      .eq('visibility', 'public')
      .single();

    if (error || !episode) {
      return NextResponse.json({ error: 'Episode not found or not public' }, { status: 404 });
    }

    return NextResponse.json({ episode });

  } catch (error) {
    console.error('Public episode API error:', error);
    return NextResponse.json({ error: 'Failed to fetch episode' }, { status: 500 });
  }
}
