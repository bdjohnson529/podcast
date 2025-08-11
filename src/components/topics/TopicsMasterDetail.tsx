"use client";

import { Sidebar } from '@/components/Sidebar';
import { TopicsTabs, useTopicsTab } from '@/components/topics/TopicsTab';
import { TopicView } from '@/components/topics/TopicView';
import { TopicForm } from '@/components/topics/TopicForm';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { usePreserveScroll } from '@/components/topics/usePreserveScroll';

export function TopicsMasterDetail({
  rightPane,
  selectedId,
}: {
  rightPane: React.ReactNode;
  selectedId: string | null;
}) {
  const { user } = useAuth();
  const router = useRouter();
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-2">
                  <div ref={listRef} className="max-h-[calc(100vh-220px)] overflow-auto pr-1">
                    <TopicView
                      topics={topics}
                      selectedId={selectedId}
                      onSelect={(id) => {
                        const url = new URL(window.location.href);
                        const tab = url.searchParams.get('tab') === 'create' ? '?tab=create' : '';
                        router.push(`/topics/${id}${tab}`);
                      }}
                    />
                  </div>
                </div>
                <div className="md:col-span-3">{rightPane}</div>
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

