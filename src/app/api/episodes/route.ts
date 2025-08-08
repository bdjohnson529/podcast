import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ episodes: [] }, { status: 200 });
      }
      
      // Fetch user's episodes
      const { data: episodes, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ episodes: [] }, { status: 200 });
      }
      
      return NextResponse.json({ episodes: episodes || [] });
    }
    
    // No auth token - return empty array
    return NextResponse.json({ episodes: [] });
    
  } catch (error) {
    console.error('Episodes API error:', error);
    return NextResponse.json({ episodes: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      id,
      topic,
      familiarity,
      industries,
      use_case,
      duration,
      script,
      audio_url
    } = body;
    
    // Insert or update episode
    const { data, error } = await supabase
      .from('episodes')
      .upsert({
        id,
        user_id: user.id,
        topic,
        familiarity,
        industries,
        use_case,
        duration,
        script,
        audio_url,
        estimated_duration: script?.estimatedDuration
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save episode' }, { status: 500 });
    }
    
    return NextResponse.json({ episode: data });
    
  } catch (error) {
    console.error('Save episode error:', error);
    return NextResponse.json({ error: 'Failed to save episode' }, { status: 500 });
  }
}
