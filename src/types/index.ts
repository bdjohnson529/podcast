// Core types for CommercializeCast
export interface PodcastInput {
  topic: string;
  familiarity: 'new' | 'some' | 'expert';
  industries: Industry[];
  useCase?: string;
}

export interface Industry {
  id: string;
  name: string;
}

export interface PodcastScript {
  id: string;
  title: string;
  overview: string;
  monetizationModels: MonetizationModel[];
  moatAndRisks: MoatAndRisks;
  buildVsBuy: BuildVsBuy;
  firstThirtyDayPlan: string[];
  glossary?: GlossaryTerm[];
  sources: Source[];
  transcript: DialogueLine[];
  estimatedDuration: number; // in minutes
  createdAt: string;
}

export interface MonetizationModel {
  name: string;
  description: string;
  gtmNotes: string[];
  revenueModel: string;
  targetCustomers: string[];
}

export interface MoatAndRisks {
  technicalRisks: string[];
  regulatoryRisks: string[];
  dataRisks: string[];
  distributionRisks: string[];
  competitiveMoats: string[];
}

export interface BuildVsBuy {
  buildRecommendation: 'build' | 'buy' | 'hybrid';
  reasoning: string;
  keyConsiderations: string[];
  timeline: string;
  resourceRequirements: string[];
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
          industries: string[];
          use_case?: string;
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
          industries: string[];
          use_case?: string;
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
          industries?: string[];
          use_case?: string;
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
