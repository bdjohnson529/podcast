"use client";

import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { TopicHeader } from './Header';

export interface TopicArticle {
  id: string; // synthetic id (feed_id + pubDate)
  title: string;
  url: string;
  published_at?: string | null;
  feed?: { id: string; name?: string | null } | null;
  summary?: string | null;
}

// Local copy of the synthesis result shape to match the actual server response
interface SynthesisResult {
  topicId: string;
  headline: string;
  article: string;
  citations: { id: string; url: string }[];
}

export function TopicNews({ id, onBack }: { id: string; onBack?: () => void }) {
  const [articles, setArticles] = useState<TopicArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Synthesis state
  const [synthError, setSynthError] = useState<string | null>(null);
  const [synthResult, setSynthResult] = useState<SynthesisResult | null>(null);
  const [requestPending, setRequestPending] = useState(false);

  async function getToken(): Promise<string | undefined> {
    const supa = (await import('@/lib/supabase')).supabase;
    const { data } = await supa.auth.getSession();
    return data.session?.access_token || undefined;
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
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

  async function startSynthesis() {
    try {
      setSynthError(null);
      setSynthResult(null);
      const token = await getToken();
      setRequestPending(true);
      
      const res = await fetch(`/api/topics/${id}/news/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      setRequestPending(false);

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any)?.error || 'Failed to start synthesis');

      // Check if server returned the synthesis directly
      if ((json as any)?.headline && (json as any)?.article) {
        setSynthResult(json as any as SynthesisResult);
        return;
      }

    } catch (e: any) {
      setRequestPending(false);
      setSynthError(e?.message || 'Failed to start synthesis');
    }
  }

  function SynthesizedArticle({ data }: { data: SynthesisResult }) {
    return (
      <div className="bg-white rounded-xl border border-primary-200 p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{data.headline}</h2>
          <p className="text-xs text-gray-500 mt-1">Generated {new Date().toLocaleString()}</p>
        </div>

        {/* Article content */}
        <div className="space-y-2 mt-2">
          <p className="text-gray-800 leading-relaxed">{data.article}</p>
        </div>

        {/* Citations */}
        {data.citations && data.citations.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Sources</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              {data.citations.map((citation, i) => (
                <li key={i}>
                  • <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {citation.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    );
  }

  if (loading && !articles) return <LoadingScreen />;

  return (
    <>
      <TopicHeader
        title={"Recent News"}
        onBack={onBack}
        className="mb-4"
        right={
          <button
            onClick={startSynthesis}
            className={`px-3 py-1.5 rounded-md text-white text-sm ${requestPending ? 'bg-gray-500' : 'bg-primary-600 hover:bg-primary-700'}`}
            title="Synthesize a summary from recent articles"
          >
            Synthesize
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="text-sm text-gray-600">Fetched {articles?.length || 0} articles</div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {/* Synthesis area */}
        {(requestPending || synthError || synthResult) && (
          <div className="pt-4 border-t border-gray-200 space-y-3">
            {requestPending && (
              <div className="text-sm text-gray-600">Synthesizing summary from recent articles… this can take up to a minute.</div>
            )}
            {synthError && (
              <div className="text-sm text-red-600">{synthError}</div>
            )}
            {synthResult && (
              <SynthesizedArticle data={synthResult} />
            )}
          </div>
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
    </>
  );
}

