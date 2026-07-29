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
import * as liveApi from './client';
import * as staticApi from './staticClient';

// The public viewer (ViewerHome/ViewerPage) goes through here instead of api/client.ts
// directly, so a single env flag switches it between the live backend (local dev,
// or a separately-hosted deployment) and the pre-exported static JSON (GitHub Pages).
const isStatic = import.meta.env.VITE_DATA_MODE === 'static';

export const fetchPages = isStatic ? staticApi.fetchPages : liveApi.fetchPages;
export const fetchPage = isStatic ? staticApi.fetchPage : liveApi.fetchPage;
export const fetchVideos = isStatic ? staticApi.fetchVideos : liveApi.fetchVideos;
export const fetchUpcomingBooks = isStatic
  ? staticApi.fetchUpcomingBooks
  : liveApi.fetchUpcomingBooks;
