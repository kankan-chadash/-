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

// Daf numbers are stored as integers (they have to sort), but a Gemara is
// referred to by Hebrew numerals — daf 54 is נ"ד, never "54".

const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];

/**
 * Hebrew numeral for a positive integer, with the usual typographic marks:
 * a geresh on a single letter (ב׳) and a gershayim before the last of several (נ״ד).
 *
 * 15 and 16 are written ט״ו and ט״ז rather than the spellings of the Divine Name.
 */
export function toGematria(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return String(value);

  let remaining = Math.floor(value);
  let letters = '';

  // Above 400 repeat ת, which is how ת״ק and up are written.
  while (remaining >= 500) {
    letters += 'ת';
    remaining -= 400;
  }
  letters += HUNDREDS[Math.floor(remaining / 100)] ?? '';
  remaining %= 100;

  if (remaining === 15 || remaining === 16) {
    letters += remaining === 15 ? 'טו' : 'טז';
  } else {
    letters += TENS[Math.floor(remaining / 10)];
    letters += ONES[remaining % 10];
  }

  if (letters.length === 0) return String(value);
  if (letters.length === 1) return `${letters}׳`;
  return `${letters.slice(0, -1)}״${letters.slice(-1)}`;
}

/** The amud, as it's said: ע״א for the front of the leaf, ע״ב for the back. */
export function amudLabel(side: 'a' | 'b'): string {
  return side === 'a' ? 'ע״א' : 'ע״ב';
}
