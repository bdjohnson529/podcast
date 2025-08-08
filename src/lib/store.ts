import { create } from 'zustand';
import { PodcastInput, PodcastScript, AudioGeneration, SavedEpisode } from '@/types';

interface AppState {
  // Current session state
  currentInput: PodcastInput;
  currentScript: PodcastScript | null;
  currentAudio: AudioGeneration | null;
  
  // UI state
  isGeneratingScript: boolean;
  isGeneratingAudio: boolean;
  audioPlaybackSpeed: number;
  
  // Saved episodes
  savedEpisodes: SavedEpisode[];
  
  // Actions
  setCurrentInput: (input: Partial<PodcastInput>) => void;
  setCurrentScript: (script: PodcastScript | null) => void;
  setCurrentAudio: (audio: AudioGeneration | null) => void;
  setIsGeneratingScript: (generating: boolean) => void;
  setIsGeneratingAudio: (generating: boolean) => void;
  setAudioPlaybackSpeed: (speed: number) => void;
  saveEpisode: (episode: SavedEpisode) => void;
  removeSavedEpisode: (id: string) => void;
  loadSavedEpisode: (episode: SavedEpisode) => void;
  resetCurrentSession: () => void;
}

const defaultInput: PodcastInput = {
  topic: '',
  familiarity: 'some',
  duration: 8, // Default to 8 minutes
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentInput: defaultInput,
  currentScript: null,
  currentAudio: null,
  isGeneratingScript: false,
  isGeneratingAudio: false,
  audioPlaybackSpeed: 1.0,
  savedEpisodes: [],

  // Actions
  setCurrentInput: (input) =>
    set((state) => ({
      currentInput: { ...state.currentInput, ...input },
    })),

  setCurrentScript: (script) =>
    set(() => ({
      currentScript: script,
    })),

  setCurrentAudio: (audio) =>
    set(() => ({
      currentAudio: audio,
    })),

  setIsGeneratingScript: (generating) =>
    set(() => ({
      isGeneratingScript: generating,
    })),

  setIsGeneratingAudio: (generating) =>
    set(() => ({
      isGeneratingAudio: generating,
    })),

  setAudioPlaybackSpeed: (speed) =>
    set(() => ({
      audioPlaybackSpeed: speed,
    })),

  saveEpisode: async (episode) => {
    set((state) => {
      const existingIndex = state.savedEpisodes.findIndex(e => e.id === episode.id);
      let newEpisodes;
      
      if (existingIndex >= 0) {
        // Update existing episode
        newEpisodes = [...state.savedEpisodes];
        newEpisodes[existingIndex] = episode;
      } else {
        // Add new episode, keep only last 5
        newEpisodes = [episode, ...state.savedEpisodes].slice(0, 5);
      }
      
      return { savedEpisodes: newEpisodes };
    });

    // Try to save to database if user is authenticated
    try {
      // Get current session from Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        const response = await fetch('/api/episodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            id: episode.id,
            topic: episode.input.topic,
            familiarity: episode.input.familiarity,
            duration: episode.input.duration,
            script: episode.script,
            audio_url: episode.audio?.audioUrl,
          }),
        });
        
        if (!response.ok) {
          console.warn('Failed to save episode to database:', response.statusText);
        }
      }
    } catch (error) {
      console.warn('Could not save episode to database:', error);
    }
  },

  removeSavedEpisode: (id) =>
    set((state) => ({
      savedEpisodes: state.savedEpisodes.filter(e => e.id !== id),
    })),

  loadSavedEpisode: (episode) =>
    set(() => ({
      currentInput: episode.input,
      currentScript: episode.script,
      currentAudio: episode.audio || null,
    })),

  resetCurrentSession: () =>
    set(() => ({
      currentInput: defaultInput,
      currentScript: null,
      currentAudio: null,
      isGeneratingScript: false,
      isGeneratingAudio: false,
    })),
}));

// Local storage persistence for saved episodes
if (typeof window !== 'undefined') {
  const savedData = localStorage.getItem('commercialize-cast-episodes');
  if (savedData) {
    try {
      const episodes = JSON.parse(savedData);
      useAppStore.setState({ savedEpisodes: episodes });
    } catch (error) {
      console.error('Failed to load saved episodes:', error);
    }
  }

  useAppStore.subscribe((state) => {
    localStorage.setItem('commercialize-cast-episodes', JSON.stringify(state.savedEpisodes));
  });
}
