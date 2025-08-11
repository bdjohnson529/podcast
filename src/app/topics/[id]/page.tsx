"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/components/AuthProvider';
import { TopicDetails } from '@/components/topics/TopicDetails';
import { TopicConfigure } from '@/components/topics/TopicConfigure';
import { TopicNews } from '@/components/topics/TopicNews';
import { TopicsTabs } from '@/components/topics/TopicsTab';

export default function TopicIdPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = useMemo(() => String(params?.id || ''), [params]);
  const paneParam = searchParams.get('pane');
  const pane: 'details' | 'configure' | 'news' = paneParam === 'configure' ? 'configure' : paneParam === 'news' ? 'news' : 'details';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  if (loading || !user) return <LoadingScreen />;

  function setPane(next: 'details' | 'configure' | 'news') {
    const url = new URL(window.location.href);
    if (next === 'details') url.searchParams.delete('pane');
    else url.searchParams.set('pane', next);
    router.replace(`/topics/${id}${url.search}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
      <Sidebar />
      <div className="ml-64">
        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Your Topics</h1>
            <p className="text-gray-600 mt-2">Create and manage your topics to organize feeds.</p>
            <TopicsTabs
              active={'view'}
              onChange={(t) => {
                if (t === 'create') router.push('/topics?tab=create');
                else router.push('/topics');
              }}
            />

            {pane === 'configure' ? (
              <TopicConfigure
                id={id}
                topic={{}}
                onDone={() => setPane('details')}
                onNews={() => setPane('news')}
              />
            ) : pane === 'news' ? (
              <TopicNews id={id} onBack={() => setPane('details')} />
            ) : (
              <TopicDetails id={id} onConfigure={() => setPane('configure')} onNews={() => setPane('news')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

