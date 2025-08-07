import { ElevenLabsVoice, ElevenLabsAudioRequest } from '@/types';

class ElevenLabsService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  private getApiKey(): string {
    if (!this.apiKey) {
      this.apiKey = process.env.ELEVENLABS_API_KEY!;
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
    try {
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

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error generating audio:', error);
      throw error;
    }
  }

  async generatePodcastAudio(
    dialogueLines: Array<{ speaker: 'CHRIS' | 'JESSICA'; text: string }>,
    voiceIds: { CHRIS: string; JESSICA: string }
  ): Promise<ArrayBuffer[]> {
    const audioSegments: ArrayBuffer[] = [];

    for (const line of dialogueLines) {
      const voiceId = voiceIds[line.speaker];
      const audio = await this.generateAudio(line.text, voiceId);
      audioSegments.push(audio);
    }

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
