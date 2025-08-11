"use client";

import { LoadingScreen } from '@/components/LoadingScreen';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { TopicsMasterDetail } from '@/components/topics/TopicsMasterDetail';
import { TopicDetails } from '@/components/topics/TopicDetails';

export default function TopicsPage() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');

  if (loading || !user) return <LoadingScreen />;

  return (
    <TopicsMasterDetail
      selectedId={selectedId}
      rightPane={<TopicDetails id={selectedId} />}
    />
  );
}

