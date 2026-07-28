/**
 * B.H. Copyright (c) 2026 Yemot HaMashiach Ltd.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Yemot HaMashiach Ltd. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Yemot HaMashiach Ltd.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 */

/**
 * Normalizes a YouTube/Vimeo watch URL (or an already-embeddable URL) into an
 * iframe-embeddable src. Falls back to the original URL for direct video files
 * or unrecognized hosts.
 */
export function toEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return url;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
    }

    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }

    if (host === 'player.vimeo.com') {
      return url;
    }

    return url;
  } catch {
    return url;
  }
}

/** The YouTube/Vimeo video id, or null for hosts we can't identify. */
function videoIdOf(url: string): { host: 'youtube' | 'vimeo'; id: string } | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      return id ? { host: 'youtube', id } : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id ? { host: 'youtube', id } : null;
      }
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments[0] === 'embed' || segments[0] === 'shorts') {
        return segments[1] ? { host: 'youtube', id: segments[1] } : null;
      }
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? { host: 'vimeo', id } : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * A poster image derivable from the URL alone. YouTube encodes it in the video
 * id; Vimeo does not, so those come back null here and need resolveThumbnail().
 */
export function toThumbnailUrl(url: string): string | null {
  const video = videoIdOf(url);
  if (video?.host === 'youtube') return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  return null;
}

// Vimeo posters have to be asked for. Its oEmbed endpoint is public and sends
// `Access-Control-Allow-Origin: *`, so the browser can call it directly with no
// backend and no API key. Results are cached per URL for the life of the page —
// the same video appears on the rail on every visit to /videos.
const vimeoThumbnails = new Map<string, Promise<string | null>>();

const VIMEO_OEMBED = 'https://vimeo.com/api/oembed.json';

async function fetchVimeoThumbnail(id: string, width: number): Promise<string | null> {
  try {
    // Ask by canonical URL rather than the stored one: saved links often carry
    // tracking query params, and oEmbed is happier without them.
    const target = `${VIMEO_OEMBED}?url=${encodeURIComponent(`https://vimeo.com/${id}`)}&width=${width}`;
    const res = await fetch(target);
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url ?? null;
  } catch {
    // Private videos, a network failure, or an offline viewer: the caller falls
    // back to the site mark, so a missing poster is never an error worth showing.
    return null;
  }
}

/**
 * Resolves a poster for any supported video, fetching it when the host doesn't
 * encode one in the URL. Returns null when no poster can be had.
 */
export function resolveThumbnail(url: string, width = 640): Promise<string | null> {
  const direct = toThumbnailUrl(url);
  if (direct) return Promise.resolve(direct);

  const video = videoIdOf(url);
  if (video?.host !== 'vimeo') return Promise.resolve(null);

  const key = `${video.id}@${width}`;
  let pending = vimeoThumbnails.get(key);
  if (!pending) {
    pending = fetchVimeoThumbnail(video.id, width);
    vimeoThumbnails.set(key, pending);
  }
  return pending;
}
