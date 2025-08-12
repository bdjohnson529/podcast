import { NextRequest, NextResponse } from 'next/server';
import { summarizeArticle, synthesize, ArticleInput } from '@/lib/news-summarize';
import { getAuthFromRequest } from '@/lib/server-auth';

async function fetchTopicArticles(userToken: string, topicId: string, origin: string) {
  // Build absolute URL from the current request origin to avoid env/base URL issues
  const url = `${origin}/api/topics/${topicId}/news?limit=50`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${userToken}` }, cache: 'no-store' });
    if (!res.ok) return [] as Array<{ id: string; title: string; url: string; published_at: string | null; summary?: string | null }>; 
    const json = await res.json().catch(() => ({} as any));
    return (json.articles || []) as Array<{ id: string; title: string; url: string; published_at: string | null; summary?: string | null }>;
  } catch {
    return [] as any[];
  }
}

// Synchronous PoC: POST returns the synthesized article immediately
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {

    // Error handling
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured on server' }, { status: 500 });
    }

    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { token } = auth;

    const topicId = params.id;
    if (!topicId) return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(20, Number((body as any)?.limit) || 10));

    // Load recent articles using this request's origin
    const origin = new URL(request.url).origin;
    const items = await fetchTopicArticles(token, topicId, origin);
    const selected = items.slice(0, limit);

    const inputs: ArticleInput[] = selected.map((it) => ({
      id: it.id,
      url: it.url,
      title: it.title,
      publishedAt: it.published_at || undefined,
      content: String(it.summary || it.title),
    }));

    // Map step
    const perArticle = await Promise.all(
      inputs.map(async (a) => {
        try { return await summarizeArticle(a); } catch { return null; }
      })
    ).then((arr) => arr.filter(Boolean) as any);

    //console.log(perArticle);

    if (perArticle.length === 0) {
      return NextResponse.json({ error: 'No summaries could be generated' }, { status: 502 });
    }

    // Reduce step
    const result = await synthesize(topicId, perArticle);

    console.log("************** returning")
    console.log(result)

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('[news-summarize] POST sync error', msg);

    // If this was an upstream model error, surface a 502 for clarity
    const status = /model|openai|upstream/i.test(msg) ? 502 : 500;
    return NextResponse.json({ error: 'Failed to synthesize', details: msg }, { status });
  }
}

// GET is not used in the sync PoC
export async function GET() {
  return NextResponse.json({ error: 'Use POST for summarize endpoint' }, { status: 405 });
}
