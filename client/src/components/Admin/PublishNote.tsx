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
import { isGithubAdminMode } from '../../api/adminData';

interface PublishNoteProps {
  /** Timestamp of the last save. Change it to show the note again. */
  savedAt: number | null;
}

/** How long the confirmation lingers — long enough to read, not long enough to nag. */
const VISIBLE_MS = 7000;

/**
 * Says an edit landed, and what happens next.
 *
 * In GitHub mode a save is a commit, and the public site rebuilds from it — so
 * the change is stored at once but visible to readers about a minute later.
 * That gap is worth naming: without it an admin checks the site, sees the old
 * version, and reasonably concludes the save failed.
 */
export function PublishNote({ savedAt }: PublishNoteProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!savedAt) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [savedAt]);

  if (!visible) return null;

  return (
    <p className="admin-publish-note" role="status">
      <span className="admin-publish-tick" aria-hidden>
        ✓
      </span>
      נשמר
      {isGithubAdminMode && <span className="admin-publish-detail">האתר מתעדכן מעצמו, בתוך כדקה.</span>}
    </p>
  );
}
