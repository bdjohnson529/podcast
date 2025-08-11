import { NextRequest, NextResponse } from 'next/server';
import { summarizeArticle, synthesize, ArticleInput } from '@/lib/news-summarize';
import { getAuthFromRequest, createUserClient } from '@/lib/server-auth';

// Reuse feed fetching from sibling route by importing it
async function fetchTopicArticles(userToken: string, topicId: string) {
  // Call our existing endpoint internally to get the list (avoids code duplication)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
  const url = baseUrl
    ? `https://${baseUrl}/api/topics/${topicId}/news?limit=50`
    : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/topics/${topicId}/news?limit=50`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${userToken}` }, cache: 'no-store' });
    if (!res.ok) return [] as Array<{ id: string; title: string; url: string; published_at: string | null }>;
    const json = await res.json().catch(() => ({} as any));
    return (json.articles || []) as Array<{ id: string; title: string; url: string; published_at: string | null; summary?: string | null }>;
  } catch {
    return [] as any[];
  }
}

// Simple in-memory job store for dev. For prod, move to Supabase table or durable queue.
// Structure: jobId -> { status: 'queued'|'running'|'done'|'error', result?, error? }
const jobs = new Map<string, any>();

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured on server' }, { status: 500 });
    }

    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, token } = auth;

    const topicId = params.id;
    if (!topicId) return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const force = !!body?.force;

    // Create job
    const jobId = newId();
    jobs.set(jobId, { status: 'queued', createdAt: Date.now(), topicId, userId: user.id });

    // Fire-and-forget processing using Promise (no durable worker yet). You can move this to a real queue.
    void (async () => {
      jobs.set(jobId, { ...jobs.get(jobId), status: 'running', startedAt: Date.now() });
      try {
        // Get latest articles
        const items = await fetchTopicArticles(token, topicId);
        // Normalize, cap for cost
        const selected = items.slice(0, 12);
        // For now, use item.summary or fetch page lightweightly if needed. We'll use summary field as content fallback.
        const inputs: ArticleInput[] = selected.map((it) => ({
          id: it.id,
          url: it.url,
          title: it.title,
          publishedAt: it.published_at || undefined,
          content: String(it.summary || it.title),
        }));

        // Map step with small concurrency
        const conc = 4;
        const out: any[] = [];
        let i = 0;
        async function worker() {
          while (true) {
            const idx = i++;
            if (idx >= inputs.length) break;
            const a = inputs[idx];
            try {
              const s = await summarizeArticle(a);
              out.push(s);
            } catch (e) {
              // continue without this article
            }
          }
        }
        await Promise.all(Array.from({ length: Math.min(conc, Math.max(1, inputs.length)) }, () => worker()));

        if (out.length === 0) throw new Error('No article summaries produced');

        const syn = await synthesize(topicId, out);
        const result = { jobId, topicId, result: syn };
        jobs.set(jobId, { ...jobs.get(jobId), status: 'done', completedAt: Date.now(), result });
      } catch (err: any) {
        jobs.set(jobId, { ...jobs.get(jobId), status: 'error', completedAt: Date.now(), error: err?.message || String(err) });
      }
    })();

    return NextResponse.json({ jobId, status: 'queued' }, { status: 202 });
  } catch (error) {
    console.error('[news-summarize] POST error', error);
    return NextResponse.json({ error: 'Failed to enqueue synthesis' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = auth;

    const jobId = request.nextUrl.searchParams.get('jobId') || '';
    if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 });

    const job = jobs.get(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Basic access control: ensure same user who created it
    if (job.userId && job.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ jobId, status: job.status, result: job.result, error: job.error }, { status: 200 });
  } catch (error) {
    console.error('[news-summarize] GET error', error);
    return NextResponse.json({ error: 'Failed to get job' }, { status: 500 });
  }
}
