import { NextRequest, NextResponse } from 'next/server';
import { getAudioBuffer } from '@/lib/audio-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scriptId = params.id;
  
  console.log('🎵 Audio streaming request for script ID:', scriptId);

  try {
    // Try to get the cached audio buffer
    const audioBuffer = getAudioBuffer(scriptId);
    
    if (audioBuffer) {
      console.log('✅ Serving cached audio buffer');
      
      // Return the audio with proper headers
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } else {
      // Fallback to a simple tone generator or silence
      console.log('⚠️ No cached audio found, generating fallback audio');
      
      // Create a simple audio buffer with a short beep
      // This is just a placeholder - in production you'd have proper error handling
      const fallbackMessage = 'Audio not available';
      
      return NextResponse.json(
        { error: fallbackMessage },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('❌ Audio streaming error:', error);
    
    return NextResponse.json(
      { error: 'Audio file not found' },
      { status: 404 }
    );
  }
}
