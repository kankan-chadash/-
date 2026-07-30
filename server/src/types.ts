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

export type Side = 'a' | 'b';
export type Shape = 'rectangle' | 'polygon';
export type ContentType = 'video' | 'image' | 'text';

export interface RectangleCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PolygonPoint {
  x: number;
  y: number;
}

export type Coordinates = RectangleCoordinates | PolygonPoint[];

export interface Region {
  id: string;
  pageId: string;
  shape: Shape;
  coordinates: Coordinates;
  contentType: ContentType;
  content: string;
  title: string | null;
  /** Manual badge position in percent; null falls back to the shape's default. */
  badgeX: number | null;
  badgeY: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  tractate: string;
  daf: number;
  side: Side;
  pageImageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageWithRegions extends Page {
  regions: Region[];
}

export interface RegionRow {
  id: string;
  page_id: string;
  shape: Shape;
  coordinates: string;
  content_type: ContentType;
  content: string;
  title: string | null;
  badge_x: number | null;
  badge_y: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PageRow {
  id: string;
  tractate: string;
  daf: number;
  side: Side;
  page_image_url: string;
  image_width: number | null;
  image_height: number | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  /** Which rail it hangs on. Always set on the way out, even for older rows. */
  category: 'general' | 'parasha';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  url: string;
  /** Null on rows written before the parasha rail existed; read as 'general'. */
  category: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UpcomingBook {
  id: string;
  tractate: string;
  note: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingBookRow {
  id: string;
  tractate: string;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
