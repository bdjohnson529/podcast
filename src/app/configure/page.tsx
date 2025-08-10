'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { Configure } from '@/components/configure/Configure';
import { ProfileLoader } from '@/components/configure/ProfileLoader';

export default function ConfigurePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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
            <ProfileLoader onSubmit={saveProfile} loader={loadProfile} />
          </div>
        </div>
      </div>
    </div>
  );
}

