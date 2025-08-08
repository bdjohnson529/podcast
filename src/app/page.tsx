'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Library } from '@/components/Library';
import { AuthBanner } from '@/components/AuthBanner';
import { CreateFlow } from '@/components/CreateFlow';
import { Sidebar } from '@/components/Sidebar';
import { Analytics } from "@vercel/analytics/next"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'create' | 'episodes'>('episodes');
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <Analytics />

      <div className="ml-64">
        <div className="p-8 space-y-8">
          <AuthBanner />

          {activeTab === 'create' && <CreateFlow />}

          {activeTab === 'episodes' && (
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
<Library />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
