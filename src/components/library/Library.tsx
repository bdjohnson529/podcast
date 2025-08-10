'use client';

import { useAppStore } from '@/lib/store';
import { useAuth } from '../AuthProvider';
import { SavedEpisode, AudioGeneration } from '@/types';
import { 
  ArrowLeftIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { AudioPlayer } from '../AudioPlayer';
import PersonalLibrary from './PersonalLibrary';
import PublicLibrary from './PublicLibrary';

export function Library() {
  const { savedEpisodes, removeSavedEpisode, loadSavedEpisode } = useAppStore();
  const { session } = useAuth();
  
  const [dbEpisodes, setDbEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingEpisode, setPlayingEpisode] = useState<any | null>(null);
  
  // Scope state - initialize from localStorage or default to 'personal'
  const [scope, setScope] = useState<'personal' | 'public'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('library-scope') as 'personal' | 'public') || 'personal';
    }
    return 'personal';
  });

  // Fetch episodes from database based on scope
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
        
        const url = scope === 'public' 
          ? `/api/episodes?scope=public`
          : '/api/episodes';
        
        const response = await fetch(url, { headers });
        
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
  }, [session?.access_token, scope]); // Re-fetch when scope changes
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case '1':
          setScope('personal');
          break;
        case '2':
          setScope('public');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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
  
  const handleShareToggle = async (episodeId: string, currentVisibility: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!session?.access_token) {
      console.error('No access token available');
      return;
    }
    
    console.log('🔄 Toggle visibility:', {
      episodeId,
      currentVisibility,
      newVisibility: currentVisibility === 'private' ? 'public' : 'private',
      sessionUserId: session?.user?.id,
      playingEpisodeUserId: playingEpisode?.user_id
    });

    try {
      const newVisibility = currentVisibility === 'private' ? 'public' : 'private';
      
      const response = await fetch(`/api/episodes/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          episodeId,
          visibility: newVisibility
        })
      });
      
      console.log('📡 API Response:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Success:', responseData);
        
        // Update local state
        setDbEpisodes(prev => prev.map(ep => 
          ep.id === episodeId ? { ...ep, visibility: newVisibility } : ep
        ));
        
        // Update playing episode state if it's the same episode
        if (playingEpisode && playingEpisode.id === episodeId) {
          setPlayingEpisode((prev: any) => ({ ...prev, visibility: newVisibility }));
        }
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
      }
    } catch (error) {
      console.error('❌ Failed to toggle visibility:', error);
    }
  };
  
  const handleCopyLink = async (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const url = `${window.location.origin}/episode/${episodeId}`;
    await navigator.clipboard.writeText(url);
    // TODO: Show toast notification
  };
  
  const handleScopeChange = (newScope: 'personal' | 'public') => {
    setScope(newScope);
    // Persist user preference
    localStorage.setItem('library-scope', newScope);
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

  // Combine local storage episodes with database episodes, excluding test episodes
  const localEpisodes = savedEpisodes || [];
  const allEpisodes = [
    ...dbEpisodes.filter(episode => episode.user_id), // Filter out test episodes (episodes without user_id)
    ...localEpisodes.filter(local => 
      !dbEpisodes.some(db => db.id === local.id)
    )
  ];

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
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
          
          {/* Publish button in playback view */}
          {(() => {
            const isOwner = session?.user?.id === playingEpisode.user_id;
            console.log('🔍 Ownership check in playback:', {
              sessionUserId: session?.user?.id,
              episodeUserId: playingEpisode.user_id,
              isOwner,
              playingEpisode
            });
            
            return isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareToggle(playingEpisode.id, playingEpisode.visibility || 'private', e);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  playingEpisode.visibility === 'public'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={playingEpisode.visibility === 'public' ? 'Make private' : 'Publish episode'}
              >
                {playingEpisode.visibility === 'public' ? (
                  <>
                    <LockClosedIcon className="h-4 w-4" />
                    <span>Make Private</span>
                  </>
                ) : (
                  <>
                    <GlobeAltIcon className="h-4 w-4" />
                    <span>Publish</span>
                  </>
                )}
              </button>
            );
          })()}
        </div>
        <AudioPlayer 
          script={script} 
          audio={audio} 
          onStartOver={() => setPlayingEpisode(null)}
        />
      </div>
    );
  }

  // Delegate view rendering to scoped components
  return (
    scope === 'personal' ? (
      <PersonalLibrary
        loading={loading}
        episodes={allEpisodes}
        scope={scope}
        session={session}
        onScopeChange={handleScopeChange}
        onLoadEpisode={handleLoadEpisode}
        onDeleteEpisode={handleDeleteEpisode}
        onCopyLink={handleCopyLink}
      />
    ) : (
      <PublicLibrary
        loading={loading}
        episodes={allEpisodes}
        scope={scope}
        session={session}
        onScopeChange={handleScopeChange}
        onLoadEpisode={handleLoadEpisode}
        onDeleteEpisode={handleDeleteEpisode}
        onCopyLink={handleCopyLink}
      />
    )
  );
}
