import { NextRequest, NextResponse } from 'next/server';
import { createUserClient, supabaseServiceRole, getAuthFromRequest } from '@/lib/server-auth';

// Minimal RSS/Atom parser using fast-xml-parser
async function fetchAndParseFeed(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.5',
        'user-agent': 'PodcastTopicNews/1.0 (+https://example.com)'
      },
      cache: 'no-store',
    });
    if (!res.ok) return { items: [] };
    const xml = await res.text();
    const { XMLParser } = await import('fast-xml-parser');
    const parser = new XMLParser({ ignoreAttributes: false });
    const data = parser.parse(xml);

    const items: Array<{ title?: string; link?: string; url?: string; pubDate?: string; updated?: string; summary?: string; content?: string } & Record<string, any>> = [];

    if (data?.rss?.channel) {
      const channel = data.rss.channel;
      const arr = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
      for (const it of arr) {
        items.push({
          title: it.title,
          link: it.link,
          url: it.link,
          pubDate: it.pubDate || it["dc:date"],
          summary: it.description,
          content: it["content:encoded"]
        });
      }
    } else if (data?.feed) {
      const feed = data.feed;
      const arr = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : [];
      for (const it of arr) {
        let link = '';
        if (Array.isArray(it.link)) {
          const alt = it.link.find((l: any) => l['@_rel'] === 'alternate');
          link = alt?.['@_href'] || it.link[0]?.['@_href'] || '';
        } else if (it.link && typeof it.link === 'object') {
          link = it.link['@_href'] || '';
        } else if (typeof it.link === 'string') {
          link = it.link;
        }
        items.push({
          title: it.title,
          link,
          url: link,
          pubDate: it.published || it.updated,
          updated: it.updated,
          summary: typeof it.summary === 'string' ? it.summary : (typeof it.summary?.['#text'] === 'string' ? it.summary['#text'] : undefined),
          content: typeof it.content === 'string' ? it.content : (typeof it.content?.['#text'] === 'string' ? it.content['#text'] : undefined),
        } as any);
      }
    }

    return { items };
  } catch {
    return { items: [] };
  } finally {
    clearTimeout(timeout);
  }
}

function coerceDate(s?: string | null): string | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// GET /api/topics/[id]/news - aggregate recent items from feeds in a topic
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, token } = auth;

    const topicId = params.id;
    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    const userClient = createUserClient(token);

    // Fetch feeds for the topic (RLS ensures ownership)
    const { data: feeds, error: feedsErr } = await userClient
      .from('feeds')
      .select('id,name,feed_url')
      .eq('topic_id', topicId);

    if (feedsErr) {
      return NextResponse.json({ error: 'Failed to load feeds' }, { status: 500 });
    }

    const feedList = (feeds || []).filter(f => !!f.feed_url);

    // Fetch items concurrently with a cap
    const concurrency = 5;
    let idx = 0;
    const articles: Array<{ id: string; title: string; url: string; published_at: string | null; feed: { id: string; name?: string | null } | null; summary?: string | null }> = [];

    async function worker() {
      while (true) {
        const i = idx++;
        if (i >= feedList.length) break;
        const f = feedList[i] as any;
        const res = await fetchAndParseFeed(f.feed_url as string);
        for (const item of res.items) {
          const title = String(item.title || '').trim();
          const url = String(item.url || item.link || '').trim();
          if (!title || !url) continue;
          const published = coerceDate(item.pubDate || item.updated);
          const id = `${f.id}:${published || url}`;
          const summary = (item.summary || item.content || '') as string;
          articles.push({ id, title, url, published_at: published, feed: { id: f.id, name: f.name }, summary });
        }
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, Math.max(1, feedList.length)) }, () => worker());
    await Promise.all(workers);

    // Sort by published desc, fallback to title
    articles.sort((a, b) => {
      const at = a.published_at ? new Date(a.published_at).getTime() : 0;
      const bt = b.published_at ? new Date(b.published_at).getTime() : 0;
      if (bt !== at) return bt - at;
      return a.title.localeCompare(b.title);
    });

    // Limit result
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = Math.max(1, Math.min(200, Number(limitParam) || 50));

    return NextResponse.json({ articles: articles.slice(0, limit) }, { status: 200 });
  } catch (error) {
    console.error('Topic news GET unexpected error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

