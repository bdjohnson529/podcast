// Core types for AudioCourse AI
export interface PodcastInput {
  topic: string;
  familiarity: 'new' | 'some' | 'expert';
  duration: number; // in minutes, 1-15
}

export interface Industry {
  id: string;
  name: string;
}

export interface PodcastScript {
  id: string;
  title: string;
  overview: string;
  keyConcepts: KeyConcept[];
  applicationsAndExamples: ApplicationsAndExamples;
  challengesAndConsiderations: ChallengesAndConsiderations;
  summaryAndTakeaways: string[];
  glossary?: GlossaryTerm[];
  sources: Source[];
  transcript: DialogueLine[];
  estimatedDuration: number; // in minutes
  wordCount: number; // total word count of the transcript
  createdAt: string;
}

export interface KeyConcept {
  name: string;
  description: string;
  importance: string;
  examples: string[];
}

export interface ApplicationsAndExamples {
  realWorldUses: string[];
  caseStudies: string[];
  practicalApplications: string[];
}

export interface ChallengesAndConsiderations {
  limitations: string[];
  debates: string[];
  complexities: string[];
  ethicalConsiderations: string[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface Source {
  title: string;
  url: string;
  type: 'research' | 'news' | 'company' | 'academic';
}

export interface DialogueLine {
  speaker: 'CHRIS' | 'JESSICA';
  text: string;
  timestamp?: number; // in seconds
}

export interface AudioGeneration {
  id: string;
  scriptId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  audioUrl?: string;
  duration?: number; // in seconds
  createdAt: string;
  error?: string;
}

export interface SavedEpisode {
  id: string;
  input: PodcastInput;
  script: PodcastScript;
  audio?: AudioGeneration;
  savedAt: string;
}

// ElevenLabs types
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  samples?: any[];
  category?: string;
  fine_tuning?: any;
  labels?: Record<string, string>;
  description?: string;
  preview_url?: string;
  available_for_tiers?: string[];
  settings?: any;
  sharing?: any;
  high_quality_base_model_ids?: string[];
}

export interface ElevenLabsAudioRequest {
  text: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

// Supabase database types
export interface Database {
  public: {
    Tables: {
      episodes: {
        Row: {
          id: string;
          user_id?: string;
          topic: string;
          familiarity: string;
          duration: number;
          script: any; // JSON
          audio_url?: string;
          audio_duration?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          topic: string;
          familiarity: string;
          duration: number;
          script: any;
          audio_url?: string;
          audio_duration?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          familiarity?: string;
          duration?: number;
          script?: any;
          audio_url?: string;
          audio_duration?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
