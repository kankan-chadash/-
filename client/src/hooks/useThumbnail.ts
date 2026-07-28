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
import { useEffect, useState } from 'react';
import { resolveThumbnail, toThumbnailUrl } from '../utils/videoEmbed';

/**
 * The poster for a video URL, or null if it has none.
 *
 * Starts from whatever the URL alone gives us (YouTube) so those never flash a
 * placeholder, then resolves the rest (Vimeo, via oEmbed) once it arrives.
 */
export function useThumbnail(url: string, width?: number): string | null {
  const [thumbnail, setThumbnail] = useState<string | null>(() => toThumbnailUrl(url));

  useEffect(() => {
    let cancelled = false;
    setThumbnail(toThumbnailUrl(url));
    resolveThumbnail(url, width).then((resolved) => {
      if (!cancelled) setThumbnail(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [url, width]);

  return thumbnail;
}
