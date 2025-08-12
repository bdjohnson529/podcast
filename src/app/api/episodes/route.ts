import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAudioStorage } from '@/lib/supabase-storage';
import { createUserClient, supabaseServiceRole, getAuthFromRequest } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'personal';
    const filters = searchParams.get('filters') ? JSON.parse(searchParams.get('filters')!) : {};
    
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    
    if (scope === 'public') {
      // Public episodes - no auth required, use service role to bypass RLS
      let query = supabaseServiceRole
        .from('episodes')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.status === 'ready') {
        query = query.not('audio_url', 'is', null);
      } else if (filters.status === 'processing') {
        query = query.is('audio_url', null);
      }

      if (filters.topic) {
        query = query.ilike('topic', `%${filters.topic}%`);
      }

      if (filters.owner === 'me' && authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user } } = await supabaseServiceRole.auth.getUser(token);
        if (user) {
          query = query.eq('user_id', user.id);
        }
      }

      query = query.limit(50);

      const { data: episodes, error } = await query;

      if (error) {
        console.error('Public episodes error:', error);
        return NextResponse.json({ episodes: [] }, { status: 200 });
      }

      return NextResponse.json({ episodes: episodes || [] });
    }
    
    // Personal episodes - auth required
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user }, error: authError } = await supabaseServiceRole.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ episodes: [] }, { status: 200 });
      }
      
      // Fetch user's episodes using user client for RLS
      const userClient = createUserClient(token);
      let query = userClient
        .from('episodes')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.status === 'ready') {
        query = query.not('audio_url', 'is', null);
      } else if (filters.status === 'processing') {
        query = query.is('audio_url', null);
      }
      
      if (filters.topic) {
        query = query.ilike('topic', `%${filters.topic}%`);
      }
      
      query = query.limit(10);
      
      const { data: episodes, error } = await query;
      
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
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      console.log('❌ No valid auth found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, token } = auth;
    
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
      audio_duration,
      visibility = 'private'
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
        audio_duration,
        visibility
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
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { user, token } = auth;
    
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
