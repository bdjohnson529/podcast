"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { LoadingScreen } from '@/components/LoadingScreen';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/components/AuthProvider';

import { TopicsTabs, useTopicsTab } from '@/components/topics/TopicsTab';
import { TopicView } from '@/components/topics/TopicView';
import { TopicForm } from '@/components/topics/TopicForm';
import { usePreserveScroll } from '@/components/topics/usePreserveScroll';
import { TopicDetails } from '@/components/topics/TopicDetails';
import { TopicConfigure } from '@/components/topics/TopicConfigure';
import { TopicNews } from '@/components/topics/TopicNews';

export default function TopicsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const selectedId = searchParams.get('id');
  const paneParam = searchParams.get('pane');
  const pane: 'details' | 'configure' | 'news' = paneParam === 'configure' ? 'configure' : paneParam === 'news' ? 'news' : 'details';

  const [topics, setTopics] = useState<Array<{ id: string; name: string; description?: string | null; created_at: string }>>([]);
  const [active, setActive] = useTopicsTab();
  const listRef = usePreserveScroll<HTMLDivElement>();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch('/api/topics', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const json = await res.json();
        if (!cancelled) setTopics(json.topics || []);
      } catch {}
    }
    if (user) load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || !user) return <LoadingScreen />;

  const selectedTopic = topics.find(t => t.id === selectedId) || null;

  function setPane(next: 'details' | 'configure' | 'news') {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'details') {
      params.delete('pane');
    } else if (next === 'configure') {
      params.set('pane', 'configure');
    } else if (next === 'news') {
      params.set('pane', 'news');
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
      <Sidebar />
      <div className="ml-64">
        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Your Topics</h1>
            <p className="text-gray-600 mt-2">Create and manage your topics to organize feeds.</p>
            <TopicsTabs active={active} onChange={setActive} />
            {active === 'view' ? (
              <div className={`grid grid-cols-1 ${selectedId ? 'md:grid-cols-5' : 'md:grid-cols-2'} gap-6`}>
                <div className="md:col-span-2">
                  <div ref={listRef} className="max-h-[calc(100vh-220px)] overflow-auto pr-1">
                    <TopicView
                      topics={topics}
                      selectedId={selectedId}
                      onSelect={(id) => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('id', id);
                        router.push(`/topics${url.search}`);
                      }}
                    />
                  </div>
                </div>
                {selectedId && (
                  <div className="md:col-span-3">
                    {pane === 'configure' ? (
                      <TopicConfigure
                        id={selectedId}
                        topic={{ name: selectedTopic?.name, description: selectedTopic?.description ?? null }}
                        onAdded={() => { /* optional refresh trigger */ }}
                        onDone={() => setPane('details')}
                        onNews={() => setPane('news')}
                      />
                    ) : pane === 'news' ? (
                      <TopicNews id={selectedId} onBack={() => setPane('details')} />
                    ) : (
                      <TopicDetails id={selectedId} onConfigure={() => setPane('configure')} onNews={() => setPane('news')} />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <TopicForm
                  onSubmit={async (values) => {
                    const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
                    const res = await fetch('/api/topics', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                      body: JSON.stringify(values),
                    });
                    if (!res.ok) {
                      const j = await res.json().catch(() => ({}));
                      throw new Error((j as any).error || 'Failed to create topic');
                    }
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

