export type RssSuggestRequest = {
  query: string;
  limit?: number; // 1..20, default 5
};

export type RssFeed = {
  title: string;
  siteUrl?: string;
  feedUrl: string;
  description?: string;
};

export type RssSuggestResponse = {
  feeds: RssFeed[];
  model?: string;
};

export function parseRssSuggestRequest(input: any):
  | { ok: true; data: Required<RssSuggestRequest> }
  | { ok: false; error: any } {
  const errors: Record<string, string> = {};
  const query = typeof input?.query === 'string' ? input.query.trim() : '';
  let limit = input?.limit;

  if (!query) {
    errors.query = 'query is required';
  }

  if (limit === undefined || limit === null || Number.isNaN(limit)) {
    limit = 5;
  }
  limit = Number(limit);
  if (!Number.isInteger(limit)) {
    errors.limit = 'limit must be an integer';
  } else if (limit < 1 || limit > 20) {
    errors.limit = 'limit must be between 1 and 20';
  }

  if (Object.keys(errors).length) return { ok: false, error: { errors } };

  return { ok: true, data: { query, limit } };
}

export function validateFeeds(input: any):
  | { ok: true; data: RssFeed[] }
  | { ok: false; error: any } {
  if (!Array.isArray(input)) {
    return { ok: false, error: { message: 'feeds must be an array' } };
  }
  const errors: any[] = [];
  const result: RssFeed[] = [];
  input.forEach((item, idx) => {
    const itemErrors: Record<string, string> = {};
    if (!item || typeof item !== 'object') {
      errors.push({ index: idx, error: 'item must be an object' });
      return;
    }
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const feedUrl = typeof item.feedUrl === 'string' ? item.feedUrl.trim() : '';
    const siteUrl = typeof item.siteUrl === 'string' ? item.siteUrl.trim() : undefined;
    const description = typeof item.description === 'string' ? item.description : undefined;

    if (!title) itemErrors.title = 'title is required';
    try { new URL(feedUrl); } catch { itemErrors.feedUrl = 'feedUrl must be a valid URL'; }
    if (siteUrl !== undefined) { try { new URL(siteUrl); } catch { itemErrors.siteUrl = 'siteUrl must be a valid URL'; } }

    if (Object.keys(itemErrors).length) {
      errors.push({ index: idx, error: itemErrors });
      return;
    }
    result.push({ title, feedUrl, siteUrl, description });
  });

  if (errors.length) return { ok: false, error: { errors } };
  return { ok: true, data: result };
}
