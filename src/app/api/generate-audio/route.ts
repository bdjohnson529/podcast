import { NextRequest, NextResponse } from 'next/server';
import { elevenLabsService, DEFAULT_VOICES } from '@/lib/elevenlabs';
import { supabase } from '@/lib/supabase';

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

    // In a real implementation, you would:
    // 1. Combine the audio segments into a single file
    // 2. Upload to storage (Supabase Storage, AWS S3, etc.)
    // 3. Return the public URL
    
    // For now, we'll simulate this with a mock response
    const mockAudioUrl = `/api/audio/${scriptId}`;
    const mockDuration = script.estimatedDuration * 60; // Convert to seconds

    const audioGeneration = {
      id: `audio_${Date.now()}`,
      scriptId,
      status: 'completed' as const,
      audioUrl: mockAudioUrl,
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

// Mock audio streaming endpoint
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const scriptId = url.pathname.split('/').pop();

  // In a real implementation, this would stream the actual audio file
  // For demo purposes, we'll return a redirect to a sample audio file
  return NextResponse.redirect('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav');
}
