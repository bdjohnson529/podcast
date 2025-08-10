'use client';

import React from "react";
import { GlobeAltIcon, ClockIcon, LinkIcon, TrashIcon } from "@heroicons/react/24/outline";
import ScopeToggle from "./ScopeToggle";

interface Props {
  loading: boolean;
  episodes: any[];
  scope: 'personal' | 'public';
  session: any;
  onScopeChange: (scope: 'personal' | 'public') => void;
  onLoadEpisode: (episode: any) => void;
  onDeleteEpisode: (id: string, e: React.MouseEvent) => void;
  onCopyLink: (id: string, e: React.MouseEvent) => void;
}

const PublicLibrary: React.FC<Props> = ({ loading, episodes, scope, session, onScopeChange, onLoadEpisode, onDeleteEpisode, onCopyLink }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <ScopeToggle scope={scope} onScopeChange={onScopeChange} showShortcutHints showPublicCount publicCount={episodes.length} />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Episodes</h3>
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500">Loading episodes...</p>
        </div>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <ScopeToggle scope={scope} onScopeChange={onScopeChange} showShortcutHints showPublicCount publicCount={episodes.length} />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Episodes</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <ClockIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500 mb-2">No public episodes found</p>
          <p className="text-sm text-gray-400 mb-4">Try switching to Personal or check back later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
          <div>
            <ScopeToggle scope={scope} onScopeChange={onScopeChange} showShortcutHints showPublicCount publicCount={episodes.length} />
          </div>
        <span className="text-sm text-gray-500">{`${episodes.length} public`}</span>
      </div>

      <div className="space-y-3">
        {episodes.map((episode: any) => {
          const hasAudio = episode.audio_url || episode.audio?.audioUrl;
          const isPublic = episode.visibility === 'public';
          const isOwner = episode.user_id === session?.user?.id;
          const canDelete = isOwner || !episode.user_id;

          return (
            <div
              key={episode.id}
              onClick={() => onLoadEpisode(episode)}
              className={`group p-3 rounded-lg cursor-pointer transition-all ${
                hasAudio ? 'hover:bg-green-50/50' : 'hover:bg-primary-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`font-medium truncate ${
                      hasAudio ? 'text-gray-900 group-hover:text-green-700' : 'text-gray-900 group-hover:text-primary-700'
                    }`}>
                      {episode.script?.title || episode.title || 'Untitled Episode'}
                    </h4>
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
                    <div>Target: {episode.input?.duration || episode.duration || 'N/A'}m</div>
                    <div>{episode.input?.familiarity || episode.familiarity || 'unknown'} level</div>
                  </div>

                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(episode.savedAt || episode.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <div className="flex items-center space-x-1">
                    {isPublic && (
                      <button
                        onClick={(e) => onCopyLink(episode.id, e)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Copy public link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={(e) => onDeleteEpisode(episode.id, e)}
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
        <p className="text-xs text-gray-500 text-center">Public episodes from the community</p>
      </div>
    </div>
  );
};

export default PublicLibrary;

