import { NextRequest, NextResponse } from 'next/server';
import { elevenLabsService, DEFAULT_VOICES } from '@/lib/elevenlabs';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { scriptId } = await request.json();

    if (!scriptId) {
      return NextResponse.json(
        { error: 'Script ID is required' },
        { status: 400 }
      );
    }

    // Fetch the script from database
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('script')
      .eq('id', scriptId)
      .single();

    if (fetchError || !episode) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    const script = episode.script;

    // Generate audio using ElevenLabs
    const audioSegments = await elevenLabsService.generatePodcastAudio(
      script.transcript,
      {
        CHRIS: DEFAULT_VOICES.CHRIS.id,
        JESSICA: DEFAULT_VOICES.JESSICA.id,
      }
    );

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

    // Update the episode record with audio information
    try {
      const { error: updateError } = await supabase
        .from('episodes')
        .update({
          audio_url: audioGeneration.audioUrl,
          audio_duration: audioGeneration.duration,
        })
        .eq('id', scriptId);

      if (updateError) {
        console.warn('Failed to update episode with audio info:', updateError);
      }
    } catch (dbError) {
      console.warn('Database update failed:', dbError);
    }

    return NextResponse.json(audioGeneration);
  } catch (error) {
    console.error('Audio generation error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to generate audio';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
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
