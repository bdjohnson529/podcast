
import { useEffect, useState } from 'react';
import { suggestFeeds } from '@/lib/client/rss';
import type { RssFeed } from '@/lib/rss-suggest';

interface TopicLikeFeed {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

interface TopicDetailsProps {
  id: string;
}

function AddSuggestedButton({ suggestion, topicId }: { suggestion: RssFeed, topicId: string }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    setErr(null);
    setAdding(true);
    try {
      const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`/api/topics/${topicId}/feeds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: suggestion.title,
          description: suggestion.description,
          feed_url: suggestion.feedUrl,
          site_url: suggestion.siteUrl,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to add feed');
      }
      setAdded(true);
    } catch (e: any) {
      setErr(e?.message || 'Failed to add feed');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={add}
        disabled={adding || added}
        className={`px-3 py-1.5 rounded text-white text-sm ${added ? 'bg-green-600' : adding ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
        aria-label={added ? 'Added' : 'Add this topic'}
        title={added ? 'Added' : 'Add this topic'}
      >
        {added ? 'Added' : adding ? 'Adding…' : 'Add to My Topics'}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}

export function TopicDetails({ id }: TopicDetailsProps) {
  const [topic, setTopic] = useState<TopicLikeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<RssFeed[] | null>(null);
  const [feeds, setFeeds] = useState<Array<{ id: string; name: string; description?: string | null; created_at: string; feed_url?: string | null; site_url?: string | null }>>([]);

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
          throw new Error(j.error || 'Failed to load topic');
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

  // Load feeds for this topic
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

  async function onSuggest() {
    if (!topic) return;
    setSuggestError(null);
    setSuggestions(null);
    setSuggesting(true);
    try {
      const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
      const { feeds } = await suggestFeeds(
        { query: topic.name || topic.description || 'podcast topic', limit: 5 },
        { accessToken: token },
      );
      setSuggestions(feeds);
    } catch (e: any) {
      setSuggestError(e?.message || 'Failed to get suggestions');
    } finally {
      setSuggesting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 mt-3">Loading topic...</p>
      </div>
    );
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

      <div className="flex items-center gap-3">
        <button
          className={`px-4 py-2 rounded text-white transition ${suggesting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
          type="button"
          onClick={onSuggest}
          disabled={suggesting}
        >
          {suggesting ? 'Getting RSS Feeds...' : 'Get RSS Feeds'}
        </button>
        {suggestError && <span className="text-sm text-red-600">{suggestError}</span>}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-900 mb-2">Suggested Feeds</h3>
          <ul className="space-y-2">
            {suggestions.map((s, idx) => (
              <li key={`${s.feedUrl}-${idx}`} className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{s.title}</p>
                    {s.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.description}</p>}
                    <div className="mt-1 space-x-3 text-sm">
                      <a className="text-primary-700 hover:underline break-all" href={s.feedUrl} target="_blank" rel="noreferrer">Feed</a>
                      {s.siteUrl && (
                        <a className="text-gray-700 hover:underline break-all" href={s.siteUrl} target="_blank" rel="noreferrer">Site</a>
                      )}
                    </div>
                  </div>
                  <AddSuggestedButton suggestion={s} topicId={id} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}


      {/* Existing feeds under this topic */}
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

