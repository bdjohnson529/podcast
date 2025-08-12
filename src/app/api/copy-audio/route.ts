import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAudioStorage } from '@/lib/supabase-storage';
import { getAuthFromRequest } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Received audio copy request');
    
    // Get auth token from header
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      console.log('❌ No valid auth found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = auth;
    
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
