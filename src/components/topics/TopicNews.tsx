"use client";

import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';

export interface TopicArticle {
  id: string; // synthetic id (feed_id + pubDate)
  title: string;
  url: string;
  published_at?: string | null;
  feed?: { id: string; name?: string | null } | null;
  summary?: string | null;
}

export function TopicNews({ id, onBack }: { id: string; onBack?: () => void }) {
  const [articles, setArticles] = useState<TopicArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch(`/api/topics/${id}/news`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as any).error || 'Failed to load news');
        }
        const json = await res.json();
        if (!cancelled) setArticles(json.articles || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load news');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading && !articles) return <LoadingScreen />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Recent News</h2>
        {onBack && (
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            onClick={onBack}
            aria-label="Back to details"
            title="Back to details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
            Back
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {(!articles || articles.length === 0) ? (
        <p className="text-gray-600">No recent articles found.</p>
      ) : (
        <ul className="space-y-3">
          {articles.map((a) => (
            <li key={a.id} className="border border-gray-200 rounded p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-primary-700 hover:underline font-medium">
                    {a.title}
                  </a>
                  {a.summary && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.summary}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {a.feed?.name ? a.feed.name + ' • ' : ''}
                    {a.published_at ? new Date(a.published_at).toLocaleString() : ''}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

