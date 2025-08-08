'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { SavedEpisodes } from '@/components/SavedEpisodes';
import { AuthBanner } from '@/components/AuthBanner';
import { CreateFlow } from '@/components/CreateFlow';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'create' | 'episodes'>('create');
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AuthBanner />

      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex gap-2">
          <button
            className={`px-4 py-2 rounded-md border ${
              activeTab === 'create'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
            onClick={() => setActiveTab('create')}
          >
            Create
          </button>
          <button
            className={`px-4 py-2 rounded-md border ${
              activeTab === 'episodes'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
            onClick={() => setActiveTab('episodes')}
          >
            Episodes
          </button>
        </div>
      </div>

      {activeTab === 'create' && <CreateFlow />}

      {activeTab === 'episodes' && (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <SavedEpisodes />
          </div>
        </div>
      )}
    </div>
  );
}
