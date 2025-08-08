import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseAudioStorage } from '@/lib/supabase-storage';

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

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user }, error: authError } = await supabaseServiceRole.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ episodes: [] }, { status: 200 });
      }
      
      // Fetch user's episodes using user client for RLS
      const userClient = createUserClient(token);
      const { data: episodes, error } = await userClient
        .from('episodes')
        .select('*')
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
    console.log('📨 Received POST request to /api/episodes');
    
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No valid auth header found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseServiceRole.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ User authenticated:', user.id);
    console.log('🔍 User object:', { id: user.id, email: user.email, role: user.role });
    
    const body = await request.json();
    console.log('📦 Request body keys:', Object.keys(body));
    
    const {
      id,
      topic,
      familiarity,
      duration,
      script,
      audio_url,
      audio_duration
    } = body;
    
    // Validate required fields
    if (!id || !topic || !familiarity || !duration || !script) {
      console.log('❌ Missing required fields:', { id: !!id, topic: !!topic, familiarity: !!familiarity, duration: !!duration, script: !!script });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log('📊 Episode data:', { id, topic, familiarity, duration, hasScript: !!script, audio_url });
    
    // Use user client for RLS compliance
    const userClient = createUserClient(token);
    console.log('🔐 Creating episode with user_id:', user.id);
    
    // Insert or update episode
    const { data, error } = await userClient
      .from('episodes')
      .upsert({
        id,
        user_id: user.id,
        topic,
        familiarity,
        duration,
        script,
        audio_url,
        audio_duration
      })
      .select()
      .single();
    
    if (error) {
      console.error('💥 Database error:', error);
      return NextResponse.json({ error: 'Failed to save episode' }, { status: 500 });
    }
    
    console.log('✅ Episode saved successfully:', data.id);
    return NextResponse.json({ episode: data });
    
  } catch (error) {
    console.error('💥 Save episode error:', error);
    return NextResponse.json({ error: 'Failed to save episode' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('id');
    
    if (!episodeId) {
      return NextResponse.json({ error: 'Episode ID is required' }, { status: 400 });
    }
    
    // Use user client for RLS compliance
    const userClient = createUserClient(token);
    
    // First get the episode to check ownership and get audio file path
    const { data: episode, error: fetchError } = await userClient
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();
    
    if (fetchError || !episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }
    
    // Delete audio file from Supabase Storage if it exists
    if (episode.audio_url && episode.audio_url.includes('supabase')) {
      const fileName = `${episodeId}.mp3`;
      const filePath = `users/${user.id}/${fileName}`;
      await SupabaseAudioStorage.deleteAudio(filePath);
    }
    
    // Delete episode from database
    const { error: deleteError } = await userClient
      .from('episodes')
      .delete()
      .eq('id', episodeId);
    
    if (deleteError) {
      console.error('Database deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Episode deleted successfully' });
    
  } catch (error) {
    console.error('Delete episode error:', error);
    return NextResponse.json({ error: 'Failed to delete episode' }, { status: 500 });
  }
}
