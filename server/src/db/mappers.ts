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
import { Page, PageRow, Region, RegionRow } from '../types';

export function mapPageRow(row: PageRow): Page {
  return {
    id: row.id,
    tractate: row.tractate,
    daf: row.daf,
    side: row.side,
    pageImageUrl: row.page_image_url,
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRegionRow(row: RegionRow): Region {
  return {
    id: row.id,
    pageId: row.page_id,
    shape: row.shape,
    coordinates: JSON.parse(row.coordinates),
    contentType: row.content_type,
    content: row.content,
    title: row.title,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
