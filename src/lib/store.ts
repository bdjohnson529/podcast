import { create } from 'zustand';
import { PodcastInput, PodcastScript, AudioGeneration, SavedEpisode, Industry } from '@/types';

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
  
  // Available industries
  availableIndustries: Industry[];
  
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
  industries: [],
  useCase: '',
};

const defaultIndustries: Industry[] = [
  { id: 'technology', name: 'Technology' },
  { id: 'science', name: 'Science' },
  { id: 'business', name: 'Business' },
  { id: 'history', name: 'History' },
  { id: 'arts', name: 'Arts & Culture' },
  { id: 'health', name: 'Health & Medicine' },
  { id: 'environment', name: 'Environment' },
  { id: 'psychology', name: 'Psychology' },
  { id: 'philosophy', name: 'Philosophy' },
  { id: 'economics', name: 'Economics' },
  { id: 'education', name: 'Education' },
  { id: 'other', name: 'Other' },
];

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentInput: defaultInput,
  currentScript: null,
  currentAudio: null,
  isGeneratingScript: false,
  isGeneratingAudio: false,
  audioPlaybackSpeed: 1.0,
  savedEpisodes: [],
  availableIndustries: defaultIndustries,

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

  saveEpisode: (episode) =>
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
    }),

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
