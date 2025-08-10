import { RssSuggestRequest, RssSuggestResponse } from '@/lib/rss-suggest';

export async function suggestFeeds(
  params: RssSuggestRequest,
  options?: { accessToken?: string; userPrompt?: string }
): Promise<RssSuggestResponse> {
  const res = await fetch('/api/feeds/suggest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: JSON.stringify({
      ...params,
      ...(options?.userPrompt ? { userPrompt: options.userPrompt } : {}),
    }),
  });

  if (!res.ok) {
    let detail: any = undefined;
    try { detail = await res.json(); } catch {}
    throw new Error(`Suggest feeds failed: ${res.status} ${res.statusText}${detail?.error ? ` - ${detail.error}` : ''}`);
  }
  return res.json();
}
