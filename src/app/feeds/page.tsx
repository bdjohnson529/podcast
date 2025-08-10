"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { FeedsList } from '@/components/feeds/FeedsList';
import { NewFeedForm } from '@/components/feeds/NewFeedForm';

export default function FeedsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [feeds, setFeeds] = useState<Array<{ id: string; name: string; description?: string | null; created_at: string }>>([]);
  const [initializing, setInitializing] = useState(true);

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
      } finally {
        setInitializing(false);
      }
    }
    if (user) load();
  }, [user]);

  async function onCreate(values: { name: string; description?: string }) {
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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

            <NewFeedForm onCreate={onCreate} />
            <FeedsList feeds={feeds} />
          </div>
        </div>
      </div>
    </div>
  );
}

