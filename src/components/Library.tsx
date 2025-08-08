'use client';

import { useAppStore } from '@/lib/store';
import { useAuth } from './AuthProvider';
import { SavedEpisode, AudioGeneration } from '@/types';
import { ClockIcon, TrashIcon, PlayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AudioPlayer } from './AudioPlayer';

export function Library() {
  const { savedEpisodes, removeSavedEpisode, loadSavedEpisode } = useAppStore();
  const { session } = useAuth();
  const [dbEpisodes, setDbEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingEpisode, setPlayingEpisode] = useState<any | null>(null);

  // Fetch episodes from database
  useEffect(() => {
    const fetchEpisodes = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch('/api/episodes', { headers });
        
        if (response.ok) {
          const data = await response.json();
          setDbEpisodes(data.episodes || []);
        }
      } catch (error) {
        console.error('Failed to fetch episodes:', error);
      }
      setLoading(false);
    };

    fetchEpisodes();
  }, [session?.access_token]); // Re-fetch when auth state changes

  const handleLoadEpisode = (episode: SavedEpisode | any) => {
    // Check if the episode has audio for playback
    if (episode.audio_url || episode.audio?.audioUrl) {
      setPlayingEpisode(episode);
    } else {
      // Convert database episode to SavedEpisode format if needed and load into session
      if (episode.script && episode.topic) {
        const savedEpisode: SavedEpisode = {
          id: episode.id,
          input: {
            topic: episode.topic,
            familiarity: episode.familiarity,
            duration: episode.duration || 8
          },
          script: episode.script,
          savedAt: episode.created_at
        };
        loadSavedEpisode(savedEpisode);
      } else {
        loadSavedEpisode(episode);
      }
    }
  };

  const handleDeleteEpisode = async (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Try to remove from local storage first
    removeSavedEpisode(episodeId);
    
    // Also delete from database if user is authenticated
    if (session?.access_token) {
      try {
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${session.access_token}`,
        };
        
        const response = await fetch(`/api/episodes?id=${episodeId}`, {
          method: 'DELETE',
          headers
        });
        
        if (response.ok) {
          // Remove from local state
          setDbEpisodes(prev => prev.filter(ep => ep.id !== episodeId));
          console.log('✅ Episode deleted from database');
        } else {
          console.warn('⚠️ Failed to delete episode from database');
        }
      } catch (error) {
        console.error('❌ Error deleting episode:', error);
      }
    }
  };

  // Combine local storage episodes with database episodes
  const localEpisodes = savedEpisodes || [];
  const allEpisodes = [...dbEpisodes, ...localEpisodes.filter(local => 
    !dbEpisodes.some(db => db.id === local.id)
  )];

  // If an episode is being played, show the audio player interface
  if (playingEpisode) {
    const script = playingEpisode.script;
    const audioUrl = playingEpisode.audio_url || playingEpisode.audio?.audioUrl;
    
    if (!script || !audioUrl) {
      // If no script or audio, go back to library
      setPlayingEpisode(null);
      return null;
    }

    const audio: AudioGeneration = {
      id: playingEpisode.audio?.id || `audio-${playingEpisode.id}`,
      scriptId: script.id,
      status: 'completed',
      audioUrl: audioUrl,
      duration: playingEpisode.audio?.duration,
      createdAt: playingEpisode.audio?.createdAt || playingEpisode.created_at
    };

    return (
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => setPlayingEpisode(null)}
            className="mr-3 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            Now Playing
          </h3>
        </div>
        <AudioPlayer 
          script={script} 
          audio={audio} 
          onStartOver={() => setPlayingEpisode(null)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Episodes
        </h3>
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500">Loading episodes...</p>
        </div>
      </div>
    );
  }

  if (allEpisodes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Episodes
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <ClockIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500 mb-2">No saved episodes yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Generate your first podcast to see it here
          </p>
          
          {!session && (
            <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-sm text-primary-700 mb-2">
                💡 <strong>Sign in to save episodes permanently!</strong>
              </p>
              <p className="text-xs text-primary-600 mb-3">
                Episodes are currently saved locally. Sign in to access them anywhere.
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
              >
                Sign in with Google
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Episodes
        </h3>
        <span className="text-sm text-gray-500">
          Last {allEpisodes.length}
        </span>
      </div>

      <div className="space-y-3">
        {allEpisodes.map((episode: any) => {
          const hasAudio = episode.audio_url || episode.audio?.audioUrl;
          
          return (
            <div
              key={episode.id}
              onClick={() => handleLoadEpisode(episode)}
              className={`group p-3 rounded-lg cursor-pointer transition-all ${
                hasAudio 
                  ? 'hover:bg-green-50/50' 
                  : 'hover:bg-primary-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium truncate ${
                      hasAudio 
                        ? 'text-gray-900 group-hover:text-green-700' 
                        : 'text-gray-900 group-hover:text-primary-700'
                    }`}>
                      {episode.script?.title || episode.title || 'Untitled Episode'}
                    </h4>
                    {hasAudio && (
                      <div className="flex items-center space-x-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        <PlayIcon className="h-3 w-3" />
                        <span className="text-xs font-medium">Ready to Play</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    Topic: {episode.input?.topic || episode.topic}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-3 w-3" />
                      <span>~{episode.script?.estimatedDuration || episode.estimated_duration || 'N/A'}m</span>
                    </div>
                    <div>
                      Target: {episode.input?.duration || episode.duration || 'N/A'}m
                    </div>
                    <div>
                      {episode.input?.familiarity || episode.familiarity || 'unknown'} level
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(episode.savedAt || episode.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <button
                  onClick={(e) => handleDeleteEpisode(episode.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Episodes automatically saved • Last 5 episodes kept
        </p>
      </div>
    </div>
  );
}
