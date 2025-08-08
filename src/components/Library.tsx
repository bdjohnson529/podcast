'use client';

import { useAppStore } from '@/lib/store';
import { useAuth } from './AuthProvider';
import { SavedEpisode, AudioGeneration } from '@/types';
import { 
  ClockIcon, 
  TrashIcon, 
  PlayIcon, 
  ArrowLeftIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ShareIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AudioPlayer } from './AudioPlayer';

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

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        {/* Scope Switcher */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleScopeChange('personal')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  scope === 'personal'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LockClosedIcon className="h-4 w-4 inline mr-1" />
                Personal
              </button>
              <button
                onClick={() => handleScopeChange('public')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  scope === 'public'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                Public
              </button>
            </div>
          </div>
        </div>
        
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
        {/* Scope Switcher */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleScopeChange('personal')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  scope === 'personal'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LockClosedIcon className="h-4 w-4 inline mr-1" />
                Personal
                <span className="ml-1 text-xs opacity-75">(1)</span>
              </button>
              <button
                onClick={() => handleScopeChange('public')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  scope === 'public'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                Public
                <span className="ml-1 text-xs opacity-75">(2)</span>
              </button>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Episodes
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <ClockIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500 mb-2">
            {scope === 'personal' ? 'No saved episodes yet' : 'No public episodes found'}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {scope === 'personal' 
              ? 'Generate your first podcast to see it here'
              : 'Try switching to Personal or check back later'
            }
          </p>
          
          {!session && scope === 'personal' && (
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
      {/* Scope Switcher */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleScopeChange('personal')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                scope === 'personal'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LockClosedIcon className="h-4 w-4 inline mr-1" />
              Personal
              <span className="ml-1 text-xs opacity-75">(1)</span>
            </button>
            <button
              onClick={() => handleScopeChange('public')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                scope === 'public'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GlobeAltIcon className="h-4 w-4 inline mr-1" />
              Public
              <span className="ml-1 text-xs opacity-75">(2)</span>
            </button>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {scope === 'personal' ? `Last ${allEpisodes.length}` : `${allEpisodes.length} public`}
        </span>
      </div>

      <div className="space-y-3">
        {allEpisodes.map((episode: any) => {
          const hasAudio = episode.audio_url || episode.audio?.audioUrl;
          const isPublic = episode.visibility === 'public';
          const isOwner = episode.user_id === session?.user?.id;
          const canDelete = isOwner || !episode.user_id; // Allow deletion if owner OR if no owner (test episodes)
          
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
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`font-medium truncate ${
                      hasAudio 
                        ? 'text-gray-900 group-hover:text-green-700' 
                        : 'text-gray-900 group-hover:text-primary-700'
                    }`}>
                      {episode.script?.title || episode.title || 'Untitled Episode'}
                    </h4>
                    
                    {/* Only show Public badge, not Personal */}
                    {isPublic && (
                      <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <GlobeAltIcon className="h-3 w-3" />
                        <span>Public</span>
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
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-1">

                  
                  {/* Icon action buttons */}
                  <div className="flex items-center space-x-1">
                    {/* Copy link button for public episodes */}
                    {isPublic && (
                      <button
                        onClick={(e) => handleCopyLink(episode.id, e)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Copy public link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Delete button (visible for owners and test episodes without owners) */}
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteEpisode(episode.id, e)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete episode"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {scope === 'personal' 
            ? 'Episodes automatically saved • Last 5 episodes kept'
            : 'Public episodes from the community'
          }
        </p>
      </div>
    </div>
  );
}
