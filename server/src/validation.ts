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
import { z } from 'zod';

const percent = z.number().min(0).max(100);

const rectangleSchema = z.object({
  x: percent,
  y: percent,
  width: percent,
  height: percent,
});

const polygonSchema = z.array(z.object({ x: percent, y: percent })).min(3);

export const regionInputSchema = z
  .object({
    id: z.string().optional(),
    shape: z.enum(['rectangle', 'polygon']),
    coordinates: z.union([rectangleSchema, polygonSchema]),
    contentType: z.enum(['video', 'image', 'text']),
    content: z.string().min(1),
    title: z.string().nullable().optional(),
    badgeX: percent.nullable().optional(),
    badgeY: percent.nullable().optional(),
    sortOrder: z.number().int().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.shape === 'rectangle' && Array.isArray(val.coordinates)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Rectangle requires x/y/width/height coordinates' });
    }
    if (val.shape === 'polygon' && !Array.isArray(val.coordinates)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Polygon requires an array of points' });
    }
  });

export const pageInputSchema = z.object({
  tractate: z.string().min(1).max(100),
  daf: z.number().int().min(2).max(200),
  side: z.enum(['a', 'b']),
  pageImageUrl: z.string().min(1),
  imageWidth: z.number().int().positive().nullable().optional(),
  imageHeight: z.number().int().positive().nullable().optional(),
});

export const pageUpdateSchema = pageInputSchema.partial();

export const regionsReplaceSchema = z.object({
  regions: z.array(regionInputSchema),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const videoInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  url: z.string().min(1).max(2000),
  sortOrder: z.number().int().optional(),
});

export const videoUpdateSchema = videoInputSchema.partial();

export const upcomingBookInputSchema = z.object({
  tractate: z.string().min(1).max(100),
  note: z.string().max(200).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const upcomingBookUpdateSchema = upcomingBookInputSchema.partial();
