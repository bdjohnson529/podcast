"use client";

import { useState } from 'react';
import { suggestFeeds } from '@/lib/client/rss';
import type { RssFeed } from '@/lib/rss-suggest';

function AddSuggestedButton({ suggestion, topicId, onAdded }: { suggestion: RssFeed, topicId: string, onAdded?: () => void }) {
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
        throw new Error((j as any).error || 'Failed to add feed');
      }
      setAdded(true);
      onAdded?.();
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
        {added ? 'Added' : adding ? 'Adding…' : 'Add to Topic'}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}

export function TopicConfigure({ id, topic, onAdded, onDone }: { id: string; topic: { name?: string; description?: string | null }; onAdded?: () => void; onDone?: () => void }) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<RssFeed[] | null>(null);

  async function onSuggest() {
    setSuggestError(null);
    setSuggestions(null);
    setSuggesting(true);
    try {
      const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
      const { feeds } = await suggestFeeds(
        id,
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{topic.name || 'Configure Topic'}</h2>
        </div>
        {onDone && (
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            onClick={onDone}
            aria-label="Save and view details"
            title="Save and view details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7l-4-4zM7 5h9v4H7V5zm9 14H8v-6h8v6z" />
            </svg>
            Save
          </button>
        )}
      </div>

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
                  <AddSuggestedButton suggestion={s} topicId={id} onAdded={onAdded} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

