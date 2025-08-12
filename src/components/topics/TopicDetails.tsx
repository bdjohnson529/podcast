"use client";

import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';

interface TopicLikeFeed {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}


import { TopicHeader } from './Header';

export function TopicDetails({ id, onConfigure, onNews, onBack }: { id: string | null; onConfigure?: () => void; onNews?: () => void; onBack?: () => void }) {
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
    <>
      <TopicHeader
        title={
          <div>
            <div className="text-2xl font-bold text-gray-900">{topic.name}</div>
            <p className="text-gray-500 text-sm mt-1">Created {new Date(topic.created_at).toLocaleString()}</p>
          </div>
        }
        onBack={onBack}
        right={
          <>
            {onNews && (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                onClick={onNews}
                aria-label="View news"
                title="View news"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M4 5h16a1 1 0 011 1v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a1 1 0 011-1zm1 2v11a1 1 0 001 1h12a1 1 0 001-1V7H5zm3 2h8v2H8V9zm0 4h8v2H8v-2z" />
                </svg>
                News
              </button>
            )}
            {onConfigure && (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                onClick={onConfigure}
                aria-label="Configure topic"
                title="Configure topic"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M19.14 12.94a7.997 7.997 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.99 7.99 0 00-1.63-.95l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.95l-2.39-.96a.5.5 0 00-.6.22L2.71 8.84a.5.5 0 00.12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32c.14.24.44.34.7.22l2.39-.96c.51.41 1.05.72 1.63.95l.36 2.54c.06.25.26.42.5.42h3.84c.24 0 .44-.17.5-.42l.36-2.54c.58-.23 1.12-.54 1.63-.95l2.39.96c.26.11.56.01.7-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" />
                </svg>
                Configure
              </button>
            )}
          </>
        }
        className="mb-4"
      />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">

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
    </>
  );
}

