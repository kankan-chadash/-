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
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { bootstrapAdmin } from './bootstrapAdmin';
import authRouter from './routes/auth';
import { publicPagesRouter } from './routes/pages';
import adminPagesRouter from './routes/pages';
import uploadRouter from './routes/upload';
import { adminVideosRouter, publicVideosRouter } from './routes/videos';

bootstrapAdmin();

const app = express();

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(config.uploadsDir));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api', publicPagesRouter);
app.use('/api', publicVideosRouter);
app.use('/api/admin', adminPagesRouter);
app.use('/api/admin', adminVideosRouter);
app.use('/api/admin', uploadRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Unexpected error' });
});

app.listen(config.port, () => {
  console.log(`Gemara viewer server listening on http://localhost:${config.port}`);
});
