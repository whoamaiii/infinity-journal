import type { LinkPreview } from '@/types';

const URL_REGEX = /https?:\/\/[^\s<>"']+/i;
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

function getMetaContent(doc: Document, property: string): string | undefined {
  const el =
    doc.querySelector(`meta[property="${property}"]`) ||
    doc.querySelector(`meta[name="${property}"]`);
  return el?.getAttribute('content') || undefined;
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const base: LinkPreview = { url, fetchedAt: Date.now() };

  try {
    const response = await fetch(CORS_PROXY + encodeURIComponent(url), {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return base;

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    return {
      ...base,
      title:
        getMetaContent(doc, 'og:title') ||
        doc.querySelector('title')?.textContent?.trim() ||
        undefined,
      description:
        getMetaContent(doc, 'og:description') ||
        getMetaContent(doc, 'description') ||
        undefined,
      image: getMetaContent(doc, 'og:image') || undefined,
      siteName:
        getMetaContent(doc, 'og:site_name') ||
        new URL(url).hostname.replace('www.', '') ||
        undefined,
    };
  } catch {
    return base;
  }
}
