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

export function coerceSynthesis(topicId: string, raw: any): SynthArticle {
  const fallbackHeadline = 'Summary';

  /*
  // Already in target shape
  if (raw && typeof raw === 'object' && isNonEmptyString(raw.headline) && isNonEmptyString(raw.article)) {
    const citesIn = ensureArray<{ id?: string; url?: string }>(raw.citations);
    const citations = citesIn
      .map((c, i) => ({ id: isNonEmptyString(c?.id) ? c.id : `[${i + 1}]`, url: cleanUrl(c?.url) }))
      .filter(c => isNonEmptyString(c.url));
    return { topicId, headline: raw.headline.trim(), article: String(raw.article), citations };
  }

  // Coerce from legacy summary shape
  const summaryIn = raw?.summary && typeof raw.summary === 'object' ? raw.summary : {};
  const headline =
    (isNonEmptyString(summaryIn.headline) && summaryIn.headline.trim()) ||
    (isNonEmptyString(raw?.headline) && raw.headline.trim()) ||
    fallbackHeadline;

  const topParas = ensureArray<string>(summaryIn.paragraphs).map(String);
  const sectionParas = ensureArray<any>(summaryIn.sections).flatMap((sec: any) =>
    ensureArray<string>(sec?.paragraphs).map(String)
  );
  const paragraphs = [...topParas, ...sectionParas].map(s => s.trim()).filter(Boolean);

  if (paragraphs.length === 0) {
    if (isNonEmptyString(summaryIn.dek)) paragraphs.push(summaryIn.dek.trim());
    const takeaways = ensureArray<string>(summaryIn.keyTakeaways).map(s => String(s).trim()).filter(Boolean);
    if (takeaways.length > 0) {
      paragraphs.push('Key Takeaways:');
      paragraphs.push(...takeaways);
    }
  }
  */

  const headline = raw.title
  const article = raw.article;
  const citations = raw.citations;

  /*
  // Citations
  let citations: { id: string; url: string }[] = [];
  const citationsIn = ensureArray<any>(raw?.citations);
  if (citationsIn.length > 0) {
    citations = citationsIn
      .map((c: any, i: number) => ({ id: isNonEmptyString(c?.id) ? c.id : `[${i + 1}]`, url: cleanUrl(c?.url) }))
      .filter(c => isNonEmptyString(c.url));
  } else {
    const sources = ensureArray<any>(raw?.sources);
    citations = sources
      .map((s: any, i: number) => ({ id: `[${i + 1}]`, url: cleanUrl(s?.url) }))
      .filter(c => isNonEmptyString(c.url));
  }

  const seen = new Set<string>();
  const deduped: { id: string; url: string }[] = [];
  for (const c of citations) {
    if (!seen.has(c.url)) { seen.add(c.url); deduped.push(c); }
  }
  */

  return { topicId, headline, article, citations: citations };
}

export async function synthesize(topicId: string, articles: ArticleSummary[]): Promise<SynthArticle> {

  console.log("************ in synthesize *****")

  const prompt = [
    {
      role: 'system' as const,
      content:
        'You synthesize multiple news sources into a concise, accurate article with citations to the source URLs provided. Avoid speculation. Output JSON only.',
    },
    {
      role: 'user' as const,
      content: JSON.stringify({ topicId, articles, schema: 'Synthesis' }),
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

  // Normalize to simplified shape
  const normalized = coerceSynthesis(topicId, raw);

  console.log("#### after coerceSynthesis")
  console.log(raw)
  console.log(normalized)

  if (!normalized || !normalized.headline) {
    throw new Error('Invalid synthesis shape');
  }

  console.log("##### raw")

  return normalized;
}
