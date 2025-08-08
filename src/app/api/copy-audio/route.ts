import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseAudioStorage } from '@/lib/supabase-storage';

// Service role client for admin operations
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Received audio copy request');
    
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
    
    console.log('✅ User authenticated for audio copy:', user.id);
    
    const { sourceScriptId, targetEpisodeId } = await request.json();
    
    if (!sourceScriptId || !targetEpisodeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log('📊 Copy request:', { sourceScriptId, targetEpisodeId, userId: user.id });
    
    // Use the SupabaseAudioStorage class to handle the copy
    const copyResult = await SupabaseAudioStorage.copyAudio(
      sourceScriptId,
      targetEpisodeId,
      user.id
    );
    
    if (!copyResult) {
      console.error('❌ Failed to copy audio file');
      return NextResponse.json({ error: 'Failed to copy audio file' }, { status: 500 });
    }
    
    console.log('✅ Audio copied successfully:', copyResult.publicUrl);
    
    return NextResponse.json({
      success: true,
      newAudioUrl: copyResult.publicUrl,
      targetPath: copyResult.path
    });
    
  } catch (error) {
    console.error('💥 Audio copy error:', error);
    return NextResponse.json({ error: 'Failed to copy audio' }, { status: 500 });
  }
}
