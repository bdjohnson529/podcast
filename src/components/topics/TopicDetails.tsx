"use client";

import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';

interface TopicLikeFeed {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}


export function TopicDetails({ id }: { id: string | null }) {
  const [topic, setTopic] = useState<TopicLikeFeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [feeds, setFeeds] = useState<Array<{ id: string; name: string; description?: string | null; created_at: string; feed_url?: string | null; site_url?: string | null }>>([]);

  // Reset state when id changes
  useEffect(() => {
    setTopic(null);
    setError(null);
    setFeeds([]);
  }, [id]);

  // Load selected topic details
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch(`/api/topics/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as any).error || 'Failed to load topic');
        }
        const json = await res.json();
        if (!cancelled) setTopic(json.topic || null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load topic');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => { cancelled = true; };
  }, [id]);

  async function refreshFeeds() {
    const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`/api/topics/${id}/feeds`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const json = await res.json();
    setFeeds(json.feeds || []);
  }

  useEffect(() => {
    let cancelled = false;
    async function loadFeeds() {
      try {
        const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch(`/api/topics/${id}/feeds`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const json = await res.json();
        if (!cancelled) setFeeds(json.feeds || []);
      } catch {
        // ignore for now
      }
    }
    if (id) loadFeeds();
    return () => { cancelled = true; };
  }, [id]);


  if (!id) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-600">
        Select a topic from the list to view details.
      </div>
    );
  }

  if (loading && !topic) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 text-red-700">{error}</div>
    );
  }

  if (!topic) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-500">Topic not found.</div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{topic.name}</h2>
          <p className="text-gray-500 text-sm mt-1">Created {new Date(topic.created_at).toLocaleString()}</p>
        </div>
      </div>

      {topic.description ? (
        <p className="text-gray-800 whitespace-pre-wrap">{topic.description}</p>
      ) : (
        <p className="text-gray-500 italic">No description provided.</p>
      )}


      <div className="mt-6">
        <h3 className="font-semibold text-gray-900 mb-2">Feeds in this Topic</h3>
        {feeds.length === 0 ? (
          <p className="text-gray-600">No feeds yet.</p>
        ) : (
          <ul className="space-y-2">
            {feeds.map((f) => (
              <li key={f.id} className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{f.name}</p>
                    {f.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{f.description}</p>}
                    <div className="mt-1 space-x-3 text-sm">
                      {f.feed_url && <a className="text-primary-700 hover:underline break-all" href={f.feed_url} target="_blank" rel="noreferrer">Feed</a>}
                      {f.site_url && <a className="text-gray-700 hover:underline break-all" href={f.site_url} target="_blank" rel="noreferrer">Site</a>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{new Date(f.created_at).toLocaleDateString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

