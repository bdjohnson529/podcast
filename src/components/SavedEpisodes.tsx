'use client';

import { useAppStore } from '@/lib/store';
import { useAuth } from './AuthProvider';
import { SavedEpisode } from '@/types';
import { ClockIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export function SavedEpisodes() {
  const { savedEpisodes, removeSavedEpisode, loadSavedEpisode } = useAppStore();
  const { session } = useAuth();
  const [dbEpisodes, setDbEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    // Convert database episode to SavedEpisode format if needed
    if (episode.script && episode.topic) {
      const savedEpisode: SavedEpisode = {
        id: episode.id,
        input: {
          topic: episode.topic,
          familiarity: episode.familiarity,
          industries: episode.industries?.map((name: string) => ({ id: name.toLowerCase(), name })) || [],
          useCase: episode.use_case || '',
          duration: episode.duration || 8
        },
        script: episode.script,
        savedAt: episode.created_at
      };
      loadSavedEpisode(savedEpisode);
    } else {
      loadSavedEpisode(episode);
    }
  };

  const handleDeleteEpisode = (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Try to remove from local storage first
    removeSavedEpisode(episodeId);
    // TODO: Add API call to delete from database
  };

  // Combine local storage episodes with database episodes
  const localEpisodes = savedEpisodes || [];
  const allEpisodes = [...dbEpisodes, ...localEpisodes.filter(local => 
    !dbEpisodes.some(db => db.id === local.id)
  )];

  if (loading) {
    return (
      <div className="card">
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
      <div className="card">
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
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Episodes
        </h3>
        <span className="text-sm text-gray-500">
          Last {allEpisodes.length}
        </span>
      </div>

      <div className="space-y-3">
        {allEpisodes.map((episode: any) => (
          <div
            key={episode.id}
            onClick={() => handleLoadEpisode(episode)}
            className="group p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate group-hover:text-primary-700">
                  {episode.script?.title || episode.title || 'Untitled Episode'}
                </h4>
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
                  {episode.audio_url && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <PlayIcon className="h-3 w-3" />
                      <span>Audio ready</span>
                    </div>
                  )}
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

            {((episode.input?.industries || episode.industries)?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(episode.input?.industries || episode.industries || []).slice(0, 3).map((industry: any, index: number) => (
                  <span
                    key={industry.id || industry || index}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                  >
                    {industry.name || industry}
                  </span>
                ))}
                {((episode.input?.industries || episode.industries)?.length || 0) > 3 && (
                  <span className="text-xs text-gray-400">
                    +{((episode.input?.industries || episode.industries)?.length || 0) - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Episodes automatically saved • Last 5 episodes kept
        </p>
      </div>
    </div>
  );
}
