"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingScreen />;
  }

  async function loadProfile(): Promise<{ company: string; role: string; specialization: string; goal: string } | null> {
    try {
      const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/profile', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      const p = json.profile;
      if (!p) return null;
      return {
        company: p.company || '',
        role: p.role || '',
        specialization: p.specialization || '',
        goal: p.goal || '',
      };
    } catch (e) {
      console.error('Failed to load profile', e);
      return null;
    }
  }

  async function saveProfile(values: { company: string; role: string; specialization: string; goal: string }) {
    const token = (await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Failed to save');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
      <Sidebar />

      <div className="ml-64">
        <div className="p-8">
          <div className="max-w-3xl mx-auto">
            <ProfileTabs onSubmit={saveProfile} loader={loadProfile} />
          </div>
        </div>
      </div>
    </div>
  );
}

