'use client';

import { useAppStore } from '@/lib/store';
import { SavedEpisode } from '@/types';
import { ClockIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/outline';

export function SavedEpisodes() {
  const { savedEpisodes, removeSavedEpisode, loadSavedEpisode } = useAppStore();

  const handleLoadEpisode = (episode: SavedEpisode) => {
    loadSavedEpisode(episode);
  };

  const handleDeleteEpisode = (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSavedEpisode(episodeId);
  };

  // Ensure savedEpisodes is an array
  const episodes = savedEpisodes || [];

  if (episodes.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Episodes
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <ClockIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500">No saved episodes yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Generate your first podcast to see it here
          </p>
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
          Last {episodes.length}
        </span>
      </div>

      <div className="space-y-3">
        {episodes.map((episode) => (
          <div
            key={episode.id}
            onClick={() => handleLoadEpisode(episode)}
            className="group p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate group-hover:text-primary-700">
                  {episode.script.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  Topic: {episode.input.topic}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>~{episode.script.estimatedDuration}m</span>
                  </div>
                  <div>
                    Target: {episode.input.duration}m
                  </div>
                  <div>
                    {episode.input.familiarity} level
                  </div>
                  {episode.audio && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <PlayIcon className="h-3 w-3" />
                      <span>Audio ready</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(episode.savedAt).toLocaleDateString()}
                </div>
              </div>
              
              <button
                onClick={(e) => handleDeleteEpisode(episode.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            {(episode.input.industries?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(episode.input.industries || []).slice(0, 3).map((industry) => (
                  <span
                    key={industry.id}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                  >
                    {industry.name}
                  </span>
                ))}
                {(episode.input.industries?.length || 0) > 3 && (
                  <span className="text-xs text-gray-400">
                    +{(episode.input.industries?.length || 0) - 3} more
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
