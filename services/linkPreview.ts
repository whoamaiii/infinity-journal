import type { LinkPreview } from '@/types';

const URL_REGEX = /https?:\/\/[^\s<>"']+/i;
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  if (!match) return null;
  return match[0].replace(/[.,;:!?)]+$/, '');
}

function getMetaContent(doc: Document, property: string): string | undefined {
  const el =
    doc.querySelector(`meta[property="${property}"]`) ||
    doc.querySelector(`meta[name="${property}"]`);
  return el?.getAttribute('content') || undefined;
}

function isValidImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url;
  } catch {}
  return undefined;
}

export async function fetchLinkPreview(
  url: string,
  signal?: AbortSignal
): Promise<LinkPreview> {
  const base: LinkPreview = { url, fetchedAt: Date.now() };

  try {
    const timeoutSignal = AbortSignal.timeout(8000);
    const response = await fetch(CORS_PROXY + encodeURIComponent(url), {
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
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
      image: isValidImageUrl(getMetaContent(doc, 'og:image')),
      siteName:
        getMetaContent(doc, 'og:site_name') ||
        new URL(url).hostname.replace('www.', '') ||
        undefined,
    };
  } catch {
    return base;
  }
}
