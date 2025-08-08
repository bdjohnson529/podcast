'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PublicEpisodePage() {
  const params = useParams();
  const episodeId = params?.id as string;
  const [episode, setEpisode] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEpisode = async () => {
      if (!episodeId) return;
      
      try {
        const response = await fetch(`/api/episodes/public/${episodeId}`);
        
        if (response.ok) {
          const data = await response.json();
          setEpisode(data.episode);
        } else {
          setError('Episode not found or not public');
        }
      } catch (error) {
        console.error('Failed to fetch episode:', error);
        setError('Failed to load episode');
      } finally {
        setLoading(false);
      }
    };

    fetchEpisode();
  }, [episodeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading episode...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Episode Not Found</h1>
              <p className="text-gray-500">{error || 'This episode may not exist or is private'}</p>
            </div>
            <Link
              href="/library?scope=public"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Browse Public Episodes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!episode.audio_url) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Audio Not Available</h1>
            <p className="text-gray-500 mb-4">This episode doesn&apos;t have audio generated yet.</p>
            <Link
              href="/library?scope=public"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Browse Public Episodes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const audio = {
    id: episode.id,
    scriptId: episode.script.id,
    status: 'completed' as const,
    audioUrl: episode.audio_url,
    duration: episode.audio_duration,
    createdAt: episode.created_at
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/library?scope=public"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Public Episodes
          </Link>
        </div>
        
        <div className="bg-white rounded-xl p-6">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {episode.script?.title || 'Public Episode'}
              </h1>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                🌐 Public
              </span>
            </div>
            <p className="text-gray-600">
              Topic: {episode.topic}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Duration: ~{episode.script?.estimatedDuration || 'N/A'}m</span>
              <span>Level: {episode.familiarity}</span>
              <span>Created: {new Date(episode.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <AudioPlayer 
            script={episode.script} 
            audio={audio} 
            onStartOver={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
