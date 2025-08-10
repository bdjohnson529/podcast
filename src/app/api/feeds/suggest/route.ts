import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { validateFeeds, parseRssSuggestRequest, RssSuggestResponse } from '@/lib/rss-suggest';

function truncate(str: string, n = 500) {
  if (!str) return str;
  return str.length > n ? str.slice(0, n) + '…[truncated]' : str;
}

// Allow only POST for controlled prompting
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    // Validate API key early with a clear message
    if (!process.env.OPENAI_API_KEY) {
      console.error('[rss-suggest] Missing OPENAI_API_KEY');
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    }

    const json = await request.json().catch(() => ({}));
    const parsed = parseRssSuggestRequest(json);
    if (!parsed.ok) {
      console.warn('[rss-suggest] Invalid request', { details: parsed.error });
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error },
        { status: 400 }
      );
    }

    const { query, limit } = parsed.data;
    const userPromptIn = typeof (json as any)?.userPrompt === 'string' ? (json as any).userPrompt.trim() : '';
    console.info('[rss-suggest] Request received', { query, limit, userPrompt: userPromptIn ? (userPromptIn.length + ' chars') : 'none' });

    // You will refine the system/user prompts.
    // We request a strict JSON schema so the response is reliable.
    const system = `You are an expert researcher specializing in surfacing up-to-date, highly relevant RSS feeds for users interested in investing in a specific industry.

Instructions:

- The user will provide an industry query and a maximum number of RSS feeds to return (limit).
- Locate the most current, active, and industry-specific RSS feeds matching the user query.
- Ensure each feed is clearly focused on the user's specified industry and is presently active.
- Prioritize official RSS feeds and https URLs when available.
- Return no more than the user-specified limit of feeds.
- If no suitable feeds are found, return an empty array.

After compiling results, perform a brief check to confirm all feeds are active, relevant to the query, and respect the user’s limit; correct any issues if found before finalizing output.

Output Structure (return as plain JSON — no markdown, comments, or extra text):
{
"feeds": [
{
"title": string, // required: podcast name
"feedUrl": string, // required: absolute URL to the RSS/Atom feed
"siteUrl"?: string, // optional: absolute URL to the podcast's website
"description"?: string // optional: short summary of the podcast
}
]
}

- Output must be valid JSON (no trailing commas, comments, or extra fields).
- Only include feeds that are currently active and relevant to the user's specified industry.
- Respect the user-specified feed limit.
- Use https URLs whenever possible.
- If no feeds can be found, output: {"feeds": []}`;

    const user = userPromptIn
      ? `Query: ${query}\n\nAdditional context to follow strictly:\n${userPromptIn}`
      : `Query: ${query}`;

    // Use responses API with JSON schema when available, otherwise text + parse fallback
    const model = process.env.OPENAI_MODEL || 'gpt-5';

    let raw = '';
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      });
      // Log minimal metadata to help debug model issues
      // @ts-ignore
      const responseId = (response as any)?.id;
      console.info('[rss-suggest] OpenAI response received', { model, responseId });
      raw = response.choices?.[0]?.message?.content || '';
      if (!raw) {
        console.warn('[rss-suggest] Empty content from model', { model, responseId });
      } else {
        console.debug('[rss-suggest] Raw model content (truncated)', { preview: truncate(raw, 300) });
      }
    } catch (err: any) {
      // Try to surface useful error information without leaking secrets
      const status = err?.status || err?.response?.status;
      const data = err?.response?.data || err?.message || String(err);
      console.error('[rss-suggest] OpenAI request failed', { model, status, data });
      return NextResponse.json(
        { error: 'Upstream model error', status, details: typeof data === 'string' ? data : undefined },
        { status: 502 }
      );
    }

    // Expected to be JSON; validate safely
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch (e) {
      console.warn('[rss-suggest] Non-JSON model response', { preview: truncate(raw, 300) });
      return NextResponse.json(
        { error: 'Model returned non-JSON response', raw: truncate(raw, 1000) },
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
      console.warn('[rss-suggest] Unexpected JSON shape from model', { preview: truncate(JSON.stringify(parsedJson), 500) });
      return NextResponse.json(
        { error: 'Unexpected JSON shape from model', raw: parsedJson },
        { status: 502 }
      );
    }

    // Validate feed items
    const feedsResult = validateFeeds(feeds);
    if (!feedsResult.ok) {
      console.warn('[rss-suggest] Feed validation failed', { details: feedsResult.error });
      return NextResponse.json(
        { error: 'Invalid feed items from model', details: feedsResult.error },
        { status: 502 }
      );
    }

    const final: RssSuggestResponse = { feeds: feedsResult.data, model };
    if (final.feeds.length === 0) {
      console.info('[rss-suggest] Success but empty result', { duration_ms: Date.now() - startedAt });
    } else {
      console.info('[rss-suggest] Success', { duration_ms: Date.now() - startedAt, count: final.feeds.length });
    }
    return NextResponse.json(final, { status: 200 });
  } catch (error) {
    console.error('[rss-suggest] Unhandled error', error);
    return NextResponse.json(
      { error: 'Failed to suggest RSS feeds' },
      { status: 500 }
    );
  }
}
