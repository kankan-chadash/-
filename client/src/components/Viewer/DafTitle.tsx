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
import type { Page } from '../../types';
import { formatDaf } from '../../utils/library';

/**
 * A tractate name is usually Hebrew while the daf ("54b") is Latin, so printing
 * them as one string lets bidi reorder the pieces — "בבא קמא 54b" comes out
 * scrambled. Isolating the name keeps the daf where it was written.
 */
export function DafTitle({ page }: { page: Pick<Page, 'tractate' | 'daf' | 'side'> }) {
  return (
    <>
      <bdi>{page.tractate}</bdi> {formatDaf(page)}
    </>
  );
}
