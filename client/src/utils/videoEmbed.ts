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
 * A poster image for a video URL, or null when we can't derive one without an
 * API call (Vimeo thumbnails need oEmbed, so those fall back to the site mark).
 */
export function toThumbnailUrl(url: string): string | null {
  const video = videoIdOf(url);
  if (video?.host === 'youtube') return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  return null;
}
