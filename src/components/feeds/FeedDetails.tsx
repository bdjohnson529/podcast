"use client";

import { useEffect, useState } from 'react';

interface Feed {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

interface FeedDetailsProps {
  id: string;
}

export function FeedDetails({ id }: FeedDetailsProps) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch(`/api/feeds/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || 'Failed to load feed');
        }
        const json = await res.json();
        if (!cancelled) setFeed(json.feed || null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load feed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 mt-3">Loading feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 text-red-700">{error}</div>
    );
  }

  if (!feed) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-500">Feed not found.</div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{feed.name}</h2>
          <p className="text-gray-500 text-sm mt-1">Created {new Date(feed.created_at).toLocaleString()}</p>
        </div>
      </div>

      {feed.description ? (
        <p className="text-gray-800 whitespace-pre-wrap">{feed.description}</p>
      ) : (
        <p className="text-gray-500 italic">No description provided.</p>
      )}
    </div>
  );
}

