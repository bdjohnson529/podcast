"use client";

import { LoadingScreen } from '@/components/LoadingScreen';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { TopicsMasterDetail } from '@/components/topics/TopicsMasterDetail';

export default function TopicsPage() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const parts = (pathname || '').split('/').filter(Boolean);
  const selectedId = parts.length >= 2 && parts[0] === 'topics' ? (parts[1] || null) : null;

  if (loading || !user) return <LoadingScreen />;

  return (
    <TopicsMasterDetail
      selectedId={selectedId}
      rightPane={selectedId ? (
        <iframe
          src={`/topics/${selectedId}`}
          className="w-full h-[70vh] rounded-xl border border-gray-200 bg-white"
          title="Topic Details"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-gray-600">
          Select a topic from the list to view details.
        </div>
      )}
    />
  );
}

