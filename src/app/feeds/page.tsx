"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { FeedView } from '@/components/feeds/FeedView';
import { FeedForm } from '@/components/feeds/FeedForm';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function FeedsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [feeds, setFeeds] = useState<Array<{ id: string; name: string; description?: string | null; created_at: string }>>([]);
  const [initializing, setInitializing] = useState(true);
  const [active, setActive] = useState<'view' | 'create'>('view');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function load() {
      try {
        const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch('/api/feeds', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const json = await res.json();
        setFeeds(json.feeds || []);
      } catch (e) {
        console.error('Failed to load feeds', e);
        setError('Failed to load feeds');
      } finally {
        setInitializing(false);
      }
    }
    if (user) load();
  }, [user]);

  async function onCreate(values: { name: string; description?: string }) {
    setError(null);
    const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch('/api/feeds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Failed to create feed');
    }
    const j = await res.json();
    setFeeds((prev) => [j.feed, ...prev]);
  }

  if (loading || !user || initializing) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
      <Sidebar />
      <div className="ml-64">
        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h1 className="text-3xl font-bold text-gray-900">Your Feeds</h1>
              <p className="text-gray-600 mt-2">Create and manage your personalized podcast feeds.</p>
            </div>

            {/* Tabs header (mirrors ProfileTabs) */}
            <div className="mb-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {[{ key: 'view' as const, label: 'Feeds' }, { key: 'create' as const, label: 'Create' }].map(t => (
                  <button
                    key={t.key}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      active === t.key
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActive(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {error && (
              <div className="bg-white rounded-xl border border-red-200 p-4 text-red-700">{error}</div>
            )}

            {active === 'view' && (
              <div className="mt-4">
                <FeedView feeds={feeds} />
              </div>
            )}

            {active === 'create' && (
              <div className="mt-4">
                <FeedForm
                  onSubmit={async (values) => {
                    await onCreate(values);
                    setActive('view');
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

