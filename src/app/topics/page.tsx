"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { TopicView } from '@/components/topics/TopicView';
import { TopicForm } from '@/components/topics/TopicForm';
import { LoadingScreen } from '@/components/LoadingScreen';
import { TopicDetails } from '@/components/topics/TopicDetails';

export default function TopicsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<Array<{ id: string; name: string; description?: string | null; created_at: string }>>([]);
  const [initializing, setInitializing] = useState(true);
  const [active, setActive] = useState<'view' | 'create'>('view');
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function load() {
      try {
        const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch('/api/topics', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const json = await res.json();
        setTopics(json.topics || []);
      } catch (e) {
        console.error('Failed to load topics', e);
        setError('Failed to load topics');
      } finally {
        setInitializing(false);
      }
    }
    if (user) load();
  }, [user]);

  // Sync selected topic with URL search params (?topic=ID)
  const searchParams = useSearchParams();
  useEffect(() => {
    const id = searchParams.get('topic');
    setSelectedId(id);
  }, [searchParams]);

  async function onCreate(values: { name: string; description?: string }) {
    setError(null);
    const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Failed to create topic');
    }
    const j = await res.json();
    setTopics((prev) => [j.topic, ...prev]);
  }

  if (loading || !user || initializing) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
      <Sidebar />
      <div className="ml-64">
        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Your Topics</h1>
            <p className="text-gray-600 mt-2">Create and manage your topics to organize feeds.</p>

            {/* Tabs header */}
            <div className="mb-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {[{ key: 'view' as const, label: 'Topics' }, { key: 'create' as const, label: 'Create' }].map(t => (
                  <button
                    key={t.key}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      active === t.key
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setActive(t.key);
                      if (t.key === 'view') {
                        // Clear selected topic and remove ?topic from URL
                        setSelectedId(null);
                        const url = new URL(window.location.href);
                        url.searchParams.delete('topic');
                        window.history.replaceState(null, '', url.toString());
                      }
                    }}
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
              selectedId ? (
                <div className="mt-4 space-y-4">
                  <TopicDetails id={selectedId} />
                </div>
              ) : (
                <div className="mt-4">
                  <TopicView
                    topics={topics}
                    onSelect={(id) => {
                      setSelectedId(id);
                      const url = new URL(window.location.href);
                      url.searchParams.set('topic', id);
                      window.history.replaceState(null, '', url.toString());
                    }}
                  />
                </div>
              )
            )}

            {active === 'create' && (
              <div className="mt-4">
                <TopicForm
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

