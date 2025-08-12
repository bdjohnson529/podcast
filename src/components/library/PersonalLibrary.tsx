'use client';

import React from "react";
import Link from "next/link";
import { ClockIcon, TrashIcon } from "@heroicons/react/24/outline";
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

const PersonalLibrary: React.FC<Props> = ({ loading, episodes, scope, session, onScopeChange, onLoadEpisode, onDeleteEpisode, onCopyLink }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <ScopeToggle scope={scope} onScopeChange={onScopeChange} showShortcutHints />
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
            <ScopeToggle scope={scope} onScopeChange={onScopeChange} showShortcutHints />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Episodes</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <ClockIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500 mb-2">No saved episodes yet</p>
          <p className="text-sm text-gray-400 mb-4">Generate your first podcast to see it here</p>

          {!session && (
            <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-sm text-primary-700 mb-2">💡 <strong>Sign in to save episodes permanently!</strong></p>
              <p className="text-xs text-primary-600 mb-3">Episodes are currently saved locally. Sign in to access them anywhere.</p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <ScopeToggle scope={scope} onScopeChange={onScopeChange} showShortcutHints />
        </div>
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
              className={`group p-3 rounded-lg cursor-pointer transition-all ${hasAudio ? 'hover:bg-green-50/50' : 'hover:bg-primary-50/50'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`font-medium truncate ${hasAudio ? 'text-gray-900 group-hover:text-green-700' : 'text-gray-900 group-hover:text-primary-700'}`}>
                      {episode.script?.title || episode.title || 'Untitled Episode'}
                    </h4>
                  </div>

                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <span>~{episode.script?.estimatedDuration || episode.estimated_duration || 'N/A'} minute listen</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(episode.savedAt || episode.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <div className="flex items-center space-x-1">
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
        <p className="text-xs text-gray-500 text-center">Episodes automatically saved • Last 5 episodes kept</p>
      </div>
    </div>
  );
};

export default PersonalLibrary;

