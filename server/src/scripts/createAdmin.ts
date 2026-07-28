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
import { db } from '../db';
import { config } from '../config';

const SALT_ROUNDS = 12;

function main() {
  if (!config.adminPassword) {
    console.error('Set ADMIN_USERNAME and ADMIN_PASSWORD in your environment before running this script.');
    process.exit(1);
  }

  const passwordHash = bcrypt.hashSync(config.adminPassword, SALT_ROUNDS);
  db.prepare(
    `INSERT INTO admins (username, password_hash) VALUES (?, ?)
     ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`
  ).run(config.adminUsername, passwordHash);

  console.log(`Admin account "${config.adminUsername}" created/updated.`);
}

main();
