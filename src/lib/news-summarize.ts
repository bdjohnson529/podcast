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

export async function synthesize(topicId: string, articles: ArticleSummary[]): Promise<Synthesis> {
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
    model: process.env.OPENAI_REDUCE_MODEL || 'gpt-4o',
    messages: prompt as any,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });
  const json = JSON.parse(resp.choices?.[0]?.message?.content || '{}');
  // Shallow shape check
  if (!json || typeof json !== 'object' || !json.summary || !json.sources) {
    throw new Error('Invalid Synthesis JSON from model');
  }
  return json as Synthesis;
}
