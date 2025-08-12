"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
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

// Local copy of the synthesis result shape to avoid importing server-only modules client-side
interface SynthesisResult {
  topicId: string;
  generatedAt: string;
  summary: {
    headline: string;
    dek?: string;
    paragraphs?: string[]; // optional top-level paragraphs in summary
    sections: { heading?: string; paragraphs: string[] }[];
    timeline?: { date?: string; event: string; sources: string[] }[];
    keyTakeaways: string[];
    risks?: string[];
    openQuestions?: string[];
  };
  sources: { url: string; title: string }[];
}

export function TopicNews({ id, onBack }: { id: string; onBack?: () => void }) {
  const [articles, setArticles] = useState<TopicArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Synthesis state
  const [synthJobId, setSynthJobId] = useState<string | null>(null);
  const [synthStatus, setSynthStatus] = useState<'idle' | 'queued' | 'running' | 'done' | 'error'>('idle');
  const [synthError, setSynthError] = useState<string | null>(null);
  const [synthResult, setSynthResult] = useState<SynthesisResult | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current as any);
        pollRef.current = null;
      }
    };
  }, []);

  async function startSynthesis() {
    try {
      console.log("*** startSynthesis *** ")

      setSynthError(null);
      setSynthResult(null);
      setSynthStatus('queued');
      const token = await getToken();
      const res = await fetch(`/api/topics/${id}/news/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      console.log(res);

      // cast as json
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any)?.error || 'Failed to start synthesis');

      //console.log(json)
      console.log("**************afterwards")

      // Sync result: server returns the synthesis directly
      if ((json as any)?.summary && (json as any)?.sources) {
        setSynthResult(json as any as SynthesisResult);
        setSynthStatus('done');
        return;
      }

      // Legacy async: fallback to polling if a jobId is returned
      const jobId = (json as any).jobId as string;
      if (!jobId) {
        throw new Error('Unexpected response from server');
      }
      setSynthJobId(jobId);
      setSynthStatus('queued');

      if (pollRef.current) clearInterval(pollRef.current as any);
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/topics/${id}/news/summarize?jobId=${encodeURIComponent(jobId)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            cache: 'no-store',
          });
          const pjson = await pollRes.json().catch(() => ({}));
          if (!pollRes.ok) throw new Error((pjson as any)?.error || 'Polling failed');
          const status = (pjson as any).status as typeof synthStatus;
          setSynthStatus(status);
          if (status === 'done') {
            const result = (pjson as any).result?.result as SynthesisResult;
            if (result) setSynthResult(result);
            if (pollRef.current) { clearInterval(pollRef.current as any); pollRef.current = null; }
          } else if (status === 'error') {
            const errMsg = (pjson as any).error || 'Synthesis failed';
            setSynthError(errMsg);
            if (pollRef.current) { clearInterval(pollRef.current as any); pollRef.current = null; }
          }
        } catch (e: any) {
          setSynthError(e?.message || 'Polling error');
          setSynthStatus('error');
          if (pollRef.current) { clearInterval(pollRef.current as any); pollRef.current = null; }
        }
      }, 1500);
    } catch (e: any) {
      setSynthStatus('error');
      setSynthError(e?.message || 'Failed to start synthesis');
    }
  }

  function SynthesizedArticle({ data }: { data: SynthesisResult }) {
    return (
      <div className="bg-white rounded-xl border border-primary-200 p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{data.summary.headline}</h2>
          {data.summary.dek && (
            <p className="text-gray-700 mt-2">{data.summary.dek}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Generated {new Date(data.generatedAt || Date.now()).toLocaleString()}</p>
        </div>

        {/* Optional top-level paragraphs */}
        {Array.isArray(data.summary.paragraphs) && data.summary.paragraphs.length > 0 && (
          <div className="space-y-2 mt-2">
            {data.summary.paragraphs.map((p, i) => (
              <p key={i} className="text-gray-800 leading-relaxed">{p}</p>
            ))}
          </div>
        )}

        {data.summary.sections?.length > 0 && (
          <div className="space-y-4">
            {data.summary.sections.map((s, i) => (
              <section key={i}>
                {s.heading && <h3 className="text-lg font-medium text-gray-900">{s.heading}</h3>}
                {s.paragraphs?.map((p, j) => (
                  <p key={j} className="text-gray-800 leading-relaxed mt-2">{p}</p>
                ))}
              </section>
            ))}
          </div>
        )}
        {data.summary.keyTakeaways?.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900">Key takeaways</h3>
            <ul className="list-disc pl-6 text-gray-800 mt-2 space-y-1">
              {data.summary.keyTakeaways.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </div>
        )}

        {data.sources?.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900">Sources</h3>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              {data.sources.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-primary-700 hover:underline">
                    {s.title || s.url}
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

  const synthInFlight = synthStatus === 'queued' || synthStatus === 'running';

  return (
    <>
      <TopicHeader
        title={"Recent News"}
        onBack={onBack}
        className="mb-4"
        right={
          <button
            onClick={startSynthesis}
            disabled={synthInFlight}
            className={`px-3 py-1.5 rounded-md text-white text-sm ${synthInFlight ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
            title="Synthesize a summary from recent articles"
          >
            {synthInFlight ? 'Synthesizing…' : 'Synthesize'}
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="text-sm text-gray-600">Fetched {articles?.length || 0} articles</div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {/* Synthesis area */}
        {(synthStatus !== 'idle') && (
          <div className="pt-4 border-t border-gray-200 space-y-3">
            {synthInFlight && (
              <div className="text-sm text-gray-600">Synthesizing summary from recent articles… this can take up to a minute.</div>
            )}
            {synthError && (
              <div className="text-sm text-red-600">{synthError}</div>
            )}
            {synthStatus === 'done' && synthResult && (
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

