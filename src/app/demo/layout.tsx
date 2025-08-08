import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AudioCourse AI Demo - Try AI-Powered Learning Podcasts',
  description: 'Try our AI-powered podcast generator for free. No signup required.',
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
