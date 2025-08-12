import { openai } from '@/lib/openai';

export type ArticleInput = {
  id: string;
  url: string;
  title: string;
  publishedAt?: string | null;
  content: string; // can be cleaned HTML or summary text
};

export type ArticleSummary = {
  url: string;
  title: string;
  publishedAt?: string;
  claims: { text: string; quote?: string }[];
  keyFacts: string[];
  stance?: string;
  uncertainties?: string[];
};

export type SynthArticle = {
  topicId: string;
  headline: string;
  article: string;
  citations: { id: string; url: string }[];
};

function truncate(str: string, n = 8000) {
  if (!str) return str;
  return str.length > n ? str.slice(0, n) + '…[truncated]' : str;
}

export async function summarizeArticle(a: ArticleInput): Promise<ArticleSummary> {

  console.log("*** summarizeArticle ***")

  const prompt = [
    {
      role: 'system' as const,
      content:
        'You are a careful analyst. Extract verifiable facts from the article. Only include quotes that appear verbatim. Output JSON only.',
    },
    {
      role: 'user' as const,
      content: JSON.stringify({
        url: a.url,
        title: a.title,
        publishedAt: a.publishedAt,
        content: truncate(a.content, 12000),
        schema: 'ArticleSummary',
      }),
    },
  ];
  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MAP_MODEL || 'gpt-4o-mini',
    messages: prompt as any,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });
  const json = JSON.parse(resp.choices?.[0]?.message?.content || '{}');
  // Shallow shape check to fail fast
  if (!json || typeof json !== 'object' || !json.title || !json.url) {
    throw new Error('Invalid ArticleSummary JSON from model');
  }
  return json as ArticleSummary;
}

function isNonEmptyString(v: any): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function ensureArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v == null) return [] as T[];
  return [v] as T[];
}

function cleanUrl(u: any): string {
  try {
    const s = String(u || '').trim();
    if (!s) return '';
    const url = new URL(s.startsWith('http') ? s : `https://${s}`);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
    return '';
  } catch {
    return '';
  }
}

function joinParagraphs(paragraphs: string[]): string {
  return paragraphs.map(p => p.trim()).filter(Boolean).join('\n\n');
}

export async function synthesize(topicId: string, articles: ArticleSummary[]): Promise<SynthArticle> {

  console.log("************ in synthesize *****")

  const prompt = [
    {
      role: 'system' as const,
      content: `You are an expert news editor who synthesizes multiple articles into a concise, accurate brief with citations.

Instructions:
- Read the provided article summaries and synthesize a brief, factual write-up.
- Avoid speculation; prefer verifiable, sourced claims.
- Write in clear, concise prose suitable for a quick-read briefing.
- Include citations that reference the provided source URLs.
- Prefer https URLs, deduplicate citations by URL, and order citations by first mention in the article body.

Output Requirements (return plain JSON — no markdown, comments, or extra text):
{
  "topicId": string,            // required: echo the provided topicId
  "headline": string,           // required: short, informative headline
  "article": string,            // required: 3–8 concise paragraphs separated by \n\n
  "citations": [                // required: sources used in the article
    { "id": string, "url": string }  // id format like "[1]", "[2]"; url must be absolute http(s)
  ]
}

- Output must be valid JSON (no trailing commas, comments, or extra fields).
- Citations must be drawn from the provided article URLs; do not invent URLs.
- If sources are insufficient to support a claim, omit the claim.
- If nothing substantive can be synthesized, output an empty article and empty citations with a generic headline.`,
    },
    {
      role: 'user' as const,
      content: JSON.stringify({ topicId, articles }),
    },
  ];

  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-5',
    messages: prompt as any,
    response_format: { type: 'json_object' },
  });

  console.log("************** response")
  console.log(resp)

  const content = resp.choices?.[0]?.message?.content || '';
  let raw: any;

  try {
    raw = JSON.parse(content);
  } catch (e) {
    return { topicId, headline: 'Summary', article: 'Model returned non-JSON response', citations: [] };
  }

  console.log("#### raw response")
  console.log(raw)

  // Validate the response has the required fields
  if (!raw || typeof raw !== 'object' || !raw.headline || !raw.article) {
    throw new Error('Invalid synthesis shape');
  }

  // Ensure citations is an array
  const citations = Array.isArray(raw.citations) ? raw.citations : [];

  const result = {
    topicId,
    headline: raw.headline,
    article: raw.article,
    citations
  };

  console.log("##### final result")
  console.log(result)

  return result;
}
