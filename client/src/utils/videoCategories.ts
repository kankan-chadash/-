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
import type { Video, VideoCategory } from '../types';

/** The rails, in the order they hang on the page. */
export const VIDEO_CATEGORIES: VideoCategory[] = ['general', 'parasha'];

export const VIDEO_CATEGORY_LABELS: Record<VideoCategory, string> = {
  general: 'סרטונים כלליים',
  parasha: 'פרשת שבוע',
};

/** Said on an empty rail, so the shelf explains itself rather than just sitting bare. */
export const VIDEO_CATEGORY_EMPTY: Record<VideoCategory, string> = {
  general: 'המסילה עדיין ריקה — לא הועלו סרטונים כלליים.',
  parasha: 'המסילה עדיין ריקה — לא הועלו סרטונים על פרשת השבוע.',
};

/**
 * Which rail a video belongs on.
 *
 * Videos saved before the parasha rail existed have no category at all, so the
 * absence has to mean something rather than break something: everything that
 * isn't explicitly another rail hangs on the general one. That is also why
 * nothing needed backfilling when the second rail shipped.
 */
export function videoCategory(video: Pick<Video, 'category'>): VideoCategory {
  return video.category === 'parasha' ? 'parasha' : 'general';
}

/** Splits a flat list into its rails, each keeping the list's own order. */
export function byCategory(videos: Video[]): Record<VideoCategory, Video[]> {
  const rails: Record<VideoCategory, Video[]> = { general: [], parasha: [] };
  for (const video of videos) rails[videoCategory(video)].push(video);
  return rails;
}
