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

export type PolygonCoordinates = PolygonPoint[];

export interface Region {
  id: string;
  pageId?: string;
  shape: Shape;
  coordinates: RectangleCoordinates | PolygonCoordinates;
  contentType: ContentType;
  content: string;
  title: string | null;
  sortOrder?: number;
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

/** A standalone educational video, shown on the videos rail — not tied to any daf. */
export interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoInput {
  title: string;
  description?: string | null;
  url: string;
  sortOrder?: number;
}

/** A volume announced on the shelf before any of its dapim are published. */
export interface UpcomingBook {
  id: string;
  tractate: string;
  note: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingBookInput {
  tractate: string;
  note?: string | null;
  sortOrder?: number;
}
