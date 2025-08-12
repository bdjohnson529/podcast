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

export type Synthesis = {
  topicId: string;
  generatedAt: string;
  summary: {
    headline: string;
    dek?: string;
    sections: { heading?: string; paragraphs: string[] }[];
    timeline?: { date?: string; event: string; sources: string[] }[];
    keyTakeaways: string[];
    risks?: string[];
    openQuestions?: string[];
  };
  sources: { url: string; title: string }[];
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

function coerceArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val == null) return [] as T[];
  return [val] as T[];
}

function coerceSynthesis(topicId: string, raw: any): Synthesis {
  const now = new Date().toISOString();
  if (!raw || typeof raw !== 'object') {
    return {
      topicId,
      generatedAt: now,
      summary: { headline: 'Summary', sections: [], keyTakeaways: [] },
      sources: [],
    };
  }

  // Some models might put fields at top-level instead of under summary
  const topHeadline = typeof raw.headline === 'string' ? raw.headline : undefined;
  const topDek = typeof raw.dek === 'string' ? raw.dek : undefined;
  const topSections = Array.isArray(raw.sections) ? raw.sections : undefined;
  const topKeyTakeaways = Array.isArray(raw.keyTakeaways) ? raw.keyTakeaways : undefined;

  const summaryIn = raw.summary && typeof raw.summary === 'object' ? raw.summary : {};
  const headline = summaryIn.headline || topHeadline || 'Summary';
  const dek = summaryIn.dek || topDek;
  const sections = Array.isArray(summaryIn.sections) ? summaryIn.sections : (topSections || []);
  const timeline = Array.isArray(summaryIn.timeline) ? summaryIn.timeline : [];
  const keyTakeaways = Array.isArray(summaryIn.keyTakeaways) ? summaryIn.keyTakeaways : (topKeyTakeaways || []);
  const risks = Array.isArray(summaryIn.risks) ? summaryIn.risks : [];
  const openQuestions = Array.isArray(summaryIn.openQuestions) ? summaryIn.openQuestions : [];

  const sourcesRaw = Array.isArray(raw.sources) ? raw.sources : [];
  const sources = sourcesRaw
    .map((s: any) => ({ url: String(s?.url || '').trim(), title: String(s?.title || '').trim() }))
    .filter((s: any) => s.url);

  return {
    topicId,
    generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : now,
    summary: {
      headline: String(headline),
      dek: dek ? String(dek) : undefined,
      sections: coerceArray<{ heading?: string; paragraphs: string[] }>(sections).map((sec: any) => ({
        heading: typeof sec?.heading === 'string' ? sec.heading : undefined,
        paragraphs: Array.isArray(sec?.paragraphs) ? sec.paragraphs.map((p: any) => String(p)) : [],
      })),
      timeline: coerceArray<{ date?: string; event: string; sources: string[] }>(timeline).map((t: any) => ({
        date: typeof t?.date === 'string' ? t.date : undefined,
        event: String(t?.event || ''),
        sources: Array.isArray(t?.sources) ? t.sources.map((u: any) => String(u)) : [],
      })),
      keyTakeaways: coerceArray<string>(keyTakeaways).map((k: any) => String(k)),
      risks: coerceArray<string>(risks).map((r: any) => String(r)),
      openQuestions: coerceArray<string>(openQuestions).map((q: any) => String(q)),
    },
    sources,
  };
}

export async function synthesize(topicId: string, articles: ArticleSummary[]): Promise<Synthesis> {

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
    // Return a minimal shell with the parsing error recorded in openQuestions
    return {
      topicId,
      generatedAt: new Date().toISOString(),
      summary: {
        headline: 'Summary',
        sections: [],
        keyTakeaways: [],
        openQuestions: ['Model returned non-JSON response'],
      },
      sources: [],
    };
  }

  console.log("************** before raw")
  console.log(raw);

  // Normalize and return a tolerant Synthesis object
  const normalized = coerceSynthesis(topicId, raw);

  // Final sanity: ensure required fields
  if (!normalized.summary || !normalized.sources) {
    throw new Error('Invalid Synthesis JSON from model');
  }

  console.log("######## normalized")
  console.log(normalized)

  return normalized;
}
