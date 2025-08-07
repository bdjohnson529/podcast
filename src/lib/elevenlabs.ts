import { ElevenLabsVoice, ElevenLabsAudioRequest } from '@/types';

class ElevenLabsService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  private getApiKey(): string {
    if (!this.apiKey) {
      this.apiKey = process.env.ELEVENLABS_API_KEY!;
      console.log('🔑 ElevenLabs API key status:', {
        isSet: !!this.apiKey,
        length: this.apiKey ? this.apiKey.length : 0,
        prefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'not set'
      });
      
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key is required');
      }
    }
    return this.apiKey;
  }

  private getHeaders() {
    return {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': this.getApiKey(),
    };
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.getApiKey(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  async generateAudio(
    text: string,
    voiceId: string,
    settings?: ElevenLabsAudioRequest['voice_settings']
  ): Promise<ArrayBuffer> {
    console.log('🎙️ ElevenLabs.generateAudio called:', {
      textLength: text.length,
      voiceId,
      hasSettings: !!settings
    });
    
    try {
      console.log('🌐 Making ElevenLabs API request...');
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          text,
          voice_settings: settings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      console.log('📡 ElevenLabs API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ElevenLabs API error response:', errorText);
        throw new Error(`Failed to generate audio: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('✅ Audio generated successfully:', {
        bufferSize: audioBuffer.byteLength
      });
      
      return audioBuffer;
    } catch (error) {
      console.error('💥 Error generating audio:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        voiceId,
        textPreview: text.substring(0, 100) + '...'
      });
      throw error;
    }
  }

  async generatePodcastAudio(
    dialogueLines: Array<{ speaker: 'CHRIS' | 'JESSICA'; text: string }>,
    voiceIds: { CHRIS: string; JESSICA: string }
  ): Promise<ArrayBuffer[]> {
    console.log('🎭 ElevenLabs.generatePodcastAudio called:', {
      dialogueLinesCount: dialogueLines.length,
      voiceIds,
      firstLinePreview: dialogueLines[0] ? {
        speaker: dialogueLines[0].speaker,
        textLength: dialogueLines[0].text.length
      } : null
    });

    const audioSegments: ArrayBuffer[] = [];

    for (let i = 0; i < dialogueLines.length; i++) {
      const line = dialogueLines[i];
      console.log(`🎤 Processing dialogue line ${i + 1}/${dialogueLines.length}:`, {
        speaker: line.speaker,
        textLength: line.text.length,
        textPreview: line.text.substring(0, 50) + '...'
      });

      try {
        const voiceId = voiceIds[line.speaker];
        if (!voiceId) {
          throw new Error(`No voice ID found for speaker: ${line.speaker}`);
        }

        const audio = await this.generateAudio(line.text, voiceId);
        audioSegments.push(audio);
        console.log(`✅ Audio generated for line ${i + 1}`);
      } catch (error) {
        console.error(`❌ Failed to generate audio for line ${i + 1}:`, {
          speaker: line.speaker,
          error: error instanceof Error ? error.message : error
        });
        throw error;
      }
    }

    console.log('🎉 All audio segments generated successfully:', {
      totalSegments: audioSegments.length,
      totalSize: audioSegments.reduce((sum, buffer) => sum + buffer.byteLength, 0)
    });

    return audioSegments;
  }
}

// Default voice configurations
export const DEFAULT_VOICES = {
  CHRIS: {
    id: 'pNInz6obpgDQGcFmaJgB', // Adam voice (masculine)
    settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  },
  JESSICA: {
    id: 'EXAVITQu4vr4xnSDxMaL', // Bella voice (feminine)
    settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  },
};

export const elevenLabsService = new ElevenLabsService();
