import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { validateFeeds, parseRssSuggestRequest, RssSuggestResponse } from '@/lib/rss-suggest';

// Allow only POST for controlled prompting
export async function POST(request: NextRequest) {
  try {
    // Validate API key early with a clear message
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    }

    const json = await request.json().catch(() => ({}));
    const parsed = parseRssSuggestRequest(json);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error },
        { status: 400 }
      );
    }

    const { query, limit } = parsed.data;

    // You will refine the system/user prompts.
    // We request a strict JSON schema so the response is reliable.
    const system = `You return a concise list of RSS podcast feeds relevant to a user query.
Return an array of objects with: title, feedUrl, optional siteUrl, optional description.
Only include feeds that are active and likely relevant. Limit to ${limit}.`;

    const user = `Query: ${query}`;

    // Use responses API with JSON schema when available, otherwise text + parse fallback
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices?.[0]?.message?.content || '';

    // Expected to be JSON; validate safely
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch (e) {
      return NextResponse.json(
        { error: 'Model returned non-JSON response', raw },
        { status: 502 }
      );
    }

    // Accept either { feeds: [...] } or a bare array [...]
    let feeds;
    if (Array.isArray(parsedJson)) {
      feeds = parsedJson;
    } else if (
      typeof parsedJson === 'object' && parsedJson !== null && 'feeds' in parsedJson
    ) {
      // @ts-ignore - runtime check above
      feeds = (parsedJson as any).feeds;
    } else {
      return NextResponse.json(
        { error: 'Unexpected JSON shape from model', raw: parsedJson },
        { status: 502 }
      );
    }

    // Validate feed items
    const feedsResult = validateFeeds(feeds);
    if (!feedsResult.ok) {
      return NextResponse.json(
        { error: 'Invalid feed items from model', details: feedsResult.error },
        { status: 502 }
      );
    }

    const final: RssSuggestResponse = { feeds: feedsResult.data, model };
    return NextResponse.json(final, { status: 200 });
  } catch (error) {
    console.error('RSS suggest error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest RSS feeds' },
      { status: 500 }
    );
  }
}
