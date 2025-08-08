import { NextRequest, NextResponse } from 'next/server';
import { elevenLabsService, DEFAULT_VOICES } from '@/lib/elevenlabs';
import { supabase } from '@/lib/supabase';
import { storeAudioBuffer, getAudioBuffer } from '@/lib/audio-cache';
import { SupabaseAudioStorage } from '@/lib/supabase-storage';

// Simple function to combine multiple audio segments
// Note: This is a basic concatenation. For production, you'd want proper audio mixing
function combineAudioSegments(audioSegments: ArrayBuffer[]): ArrayBuffer {
  console.log('🔗 Starting audio segment combination...');
  
  // Calculate total size
  const totalSize = audioSegments.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  console.log(`📊 Total combined size will be: ${totalSize} bytes`);
  
  // Create a new buffer to hold all segments
  const combinedBuffer = new ArrayBuffer(totalSize);
  const combinedArray = new Uint8Array(combinedBuffer);
  
  let offset = 0;
  audioSegments.forEach((segment, index) => {
    const segmentArray = new Uint8Array(segment);
    combinedArray.set(segmentArray, offset);
    console.log(`🔗 Added segment ${index + 1}/${audioSegments.length} at offset ${offset}, size: ${segment.byteLength}`);
    offset += segment.byteLength;
  });
  
  console.log('✅ Audio segments combined successfully');
  return combinedBuffer;
}

export async function POST(request: NextRequest) {
  console.log('🎵 Audio generation request started');
  
  try {
    const { scriptId, scriptData } = await request.json();
    console.log('📝 Request data:', { scriptId, hasScriptData: !!scriptData });

    if (!scriptId) {
      console.error('❌ No script ID provided');
      return NextResponse.json(
        { error: 'Script ID is required' },
        { status: 400 }
      );
    }

    // Get user info from auth header
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    let userId: string | null = null;
    
    if (accessToken) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
        if (!userError && user) {
          userId = user.id;
          console.log('👤 Authenticated user ID:', userId);
        }
      } catch (error) {
        console.warn('⚠️ Could not get user from token:', error);
      }
    }

    let script;

    // Try to get script from database first, but fall back to using scriptData if provided
    if (scriptData) {
      console.log('📄 Using provided script data (fallback mode)');
      script = scriptData;
    } else {
      // Try to fetch from database
      console.log('🔍 Fetching script from database...');
      const { data: episode, error: fetchError } = await supabase
        .from('episodes')
        .select('script')
        .eq('id', scriptId)
        .single();

      console.log('📊 Database query result:', {
        hasData: !!episode,
        hasError: !!fetchError,
        error: fetchError
      });

      if (fetchError || !episode) {
        console.error('❌ Script not found in database:', fetchError);
        return NextResponse.json(
          { error: 'Script not found and no fallback data provided' },
          { status: 404 }
        );
      }

      script = episode.script;
    }

    console.log('✅ Script available for processing:', {
      hasTranscript: !!script.transcript,
      transcriptLength: script.transcript?.length
    });

    // Generate audio using ElevenLabs
    console.log('🎙️ Starting ElevenLabs audio generation...');
    const audioSegments = await elevenLabsService.generatePodcastAudio(
      script.transcript,
      {
        CHRIS: DEFAULT_VOICES.CHRIS.id,
        JESSICA: DEFAULT_VOICES.JESSICA.id,
      }
    );

    console.log('✅ Audio segments generated:', audioSegments.length);

    // Combine all audio segments into one complete audio file
    console.log('🔗 Combining audio segments...');
    const combinedAudio = combineAudioSegments(audioSegments);
    console.log('✅ Audio segments combined:', {
      totalSegments: audioSegments.length,
      combinedSize: combinedAudio.byteLength,
      originalTotalSize: audioSegments.reduce((sum, buffer) => sum + buffer.byteLength, 0)
    });
    
    // Store the combined audio buffer in our cache (for immediate access)
    storeAudioBuffer(scriptId, combinedAudio);
    
    // Upload to Supabase Storage for persistent storage
    console.log('☁️ Uploading audio to Supabase Storage...');
    console.log('🔑 Upload parameters:', { scriptId, userId, hasAudio: !!combinedAudio, audioSize: combinedAudio.byteLength });
    
    const uploadResult = await SupabaseAudioStorage.uploadAudio(scriptId, combinedAudio, userId || undefined);
    
    console.log('📤 Upload result:', uploadResult);
    
    let finalAudioUrl: string;
    
    if (uploadResult) {
      console.log('✅ Audio uploaded to Supabase Storage successfully');
      finalAudioUrl = uploadResult.publicUrl;
    } else {
      console.warn('⚠️ Supabase Storage upload failed, falling back to local cache');
      finalAudioUrl = `/api/audio/${scriptId}`;
    }
    
    // Immediately test if we can retrieve it from cache (debugging)
    console.log('🧪 Testing immediate cache retrieval...');
    const testRetrieve = getAudioBuffer(scriptId);
    console.log('🧪 Immediate retrieval result:', {
      success: !!testRetrieve,
      size: testRetrieve?.byteLength || 0,
      expectedSize: combinedAudio.byteLength
    });
    
    const mockDuration = script.estimatedDuration * 60; // Convert to seconds

    const audioGeneration = {
      id: `audio_${Date.now()}`,
      scriptId,
      status: 'completed' as const,
      audioUrl: finalAudioUrl,
      duration: mockDuration,
      createdAt: new Date().toISOString(),
    };

    console.log('💾 Audio generation object created:', audioGeneration);

    // Update the episode record with audio information
    console.log('📝 Updating database with audio info...');
    try {
      const { error: updateError } = await supabase
        .from('episodes')
        .update({
          audio_url: audioGeneration.audioUrl,
          audio_duration: audioGeneration.duration,
        })
        .eq('id', scriptId);

      if (updateError) {
        console.warn('⚠️ Failed to update episode with audio info:', updateError);
      } else {
        console.log('✅ Database updated successfully');
      }
    } catch (dbError) {
      console.warn('⚠️ Database update failed:', dbError);
    }

    console.log('🎉 Audio generation completed successfully');
    return NextResponse.json(audioGeneration);
  } catch (error) {
    console.error('💥 Audio generation error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error
    });
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to generate audio';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('ElevenLabs API key')) {
        errorMessage = 'ElevenLabs API key is missing or invalid';
        statusCode = 500;
      } else if (error.message.includes('Failed to generate audio')) {
        errorMessage = `Audio generation failed: ${error.message}`;
        statusCode = 500;
      } else if (error.message.includes('Script not found')) {
        errorMessage = 'Script not found in database';
        statusCode = 404;
      } else {
        errorMessage = `Audio generation failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}
