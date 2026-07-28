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
import bcrypt from 'bcryptjs';
import { db } from './db';
import { config } from './config';

const SALT_ROUNDS = 12;

export function bootstrapAdmin(): void {
  const existing = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (existing.count > 0) {
    return;
  }

  if (!config.adminPassword) {
    console.warn(
      '[bootstrapAdmin] No admin account exists and ADMIN_PASSWORD is not set. ' +
        'Set ADMIN_USERNAME and ADMIN_PASSWORD in your .env file and restart the server to create the initial admin account.'
    );
    return;
  }

  const passwordHash = bcrypt.hashSync(config.adminPassword, SALT_ROUNDS);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(
    config.adminUsername,
    passwordHash
  );
  console.log(`[bootstrapAdmin] Created initial admin account "${config.adminUsername}".`);
}
