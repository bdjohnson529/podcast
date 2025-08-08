'use client';

import { useEffect, useState } from 'react';

/**
 * Minimal public samples player displayed on the landing page for all visitors.
 * Fetches a few public episodes with audio and renders an HTML5 audio element
 * with a tiny selector to switch between them.
 */
export default function PublicSamples() {
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState<Array<{ id: string; audio_url?: string; script?: { title?: string } }>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublic = async () => {
      try {
        setLoading(true);
        const filters = encodeURIComponent(JSON.stringify({ status: 'ready' }));
        const res = await fetch(`/api/episodes?scope=public&filters=${filters}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const withAudio = (data.episodes || []).filter((e: any) => !!e.audio_url);
        const top = withAudio.slice(0, 5);
        setEpisodes(top);
        if (top.length) setSelectedId(top[0].id);
      } catch (err) {
        console.error('Failed to load public samples', err);
        setEpisodes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPublic();
  }, []);

  if (loading) {
    return (
      <div className="mt-6 flex justify-center">
        <div className="flex items-center space-x-2 text-gray-500 text-sm">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
          <span>Loading sample…</span>
        </div>
      </div>
    );
  }

  if (!episodes.length) return null; // Hide if nothing to play

  const selected = episodes.find(e => e.id === selectedId) || episodes[0];
  const title = selected?.script?.title || 'Public episode';

  return (
    <div className="mt-6 max-w-2xl mx-auto">
      <div className="bg-white/80 backdrop-blur rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <p className="text-sm font-medium text-gray-900 truncate">Listen to a sample</p>
            <p className="text-xs text-gray-500 truncate">{title}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="sample-select">Choose episode</label>
            <select
              id="sample-select"
              className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 text-gray-700"
              value={selected?.id}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {episodes.map(ep => (
                <option key={ep.id} value={ep.id}>
                  {ep.script?.title || 'Episode'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <audio
          controls
          preload="none"
          src={selected?.audio_url}
          className="mt-3 w-full"
        />
      </div>
    </div>
  );
}
