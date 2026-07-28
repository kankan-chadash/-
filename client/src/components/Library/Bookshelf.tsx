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
import { useNavigate } from 'react-router-dom';
import type { Book } from '../../utils/library';
import { chunkIntoShelves, formatDaf, spineStyle } from '../../utils/library';

const BOOKS_PER_SHELF = 8;

interface BookshelfProps {
  books: Book[];
}

export function Bookshelf({ books }: BookshelfProps) {
  const shelves = chunkIntoShelves(books, BOOKS_PER_SHELF);

  return (
    <div className="space-y-10">
      {shelves.map((shelf, shelfIndex) => (
        <section key={shelfIndex} aria-label={`Shelf ${shelfIndex + 1}`}>
          <div className="flex h-60 items-end justify-center gap-2 rounded-t bg-black/25 px-4 shadow-inner sm:h-72 sm:gap-3 sm:px-8">
            {shelf.map((book, i) => (
              <BookSpine
                key={book.tractate}
                book={book}
                // A lone or nearly-lone volume leaning against nothing just looks broken.
                leaning={i === shelf.length - 1 && shelf.length >= 3}
              />
            ))}
          </div>
          {/* The plank the volumes stand on. */}
          <div className="surface-shelf h-5 rounded-b shadow-lg" />
        </section>
      ))}
    </div>
  );
}

function BookSpine({ book, leaning }: { book: Book; leaning: boolean }) {
  const navigate = useNavigate();
  const style = spineStyle(book.tractate, leaning);
  const dafCount = book.pages.length;

  return (
    <button
      type="button"
      // A click on the volume opens it straight to its first published daf.
      onClick={() => navigate(`/view/${book.firstPage.id}`)}
      title={`${book.tractate} — opens at daf ${formatDaf(book.firstPage)}`}
      aria-label={`Open ${book.tractate}, ${dafCount} ${dafCount === 1 ? 'daf' : 'dapim'}, starting at daf ${formatDaf(book.firstPage)}`}
      className={`book-spine ${style.leather} relative flex flex-col items-center justify-between overflow-hidden rounded-t-sm py-4 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
        style.tilted ? 'rotate-3' : ''
      }`}
      style={{ height: `${style.heightPct}%`, width: `${style.widthPx}px` }}
    >
      {/* Raised bands across the binding */}
      <span aria-hidden className="absolute inset-x-0 top-[14%] h-1 bg-black/40 shadow-[0_1px_0_rgba(255,255,255,0.08)]" />
      <span aria-hidden className="absolute inset-x-0 top-[80%] h-1 bg-black/40 shadow-[0_1px_0_rgba(255,255,255,0.08)]" />
      {/* Curvature of the spine */}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/45" />

      {/* Vertical writing rather than a rotate: it lays out in real vertical space
          (so flex can centre it) and orients Hebrew the way a real spine reads. */}
      <span className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-1">
        <span
          className="gold-embossed whitespace-nowrap font-serif text-sm tracking-widest sm:text-base"
          style={{ writingMode: 'vertical-rl' }}
        >
          {book.tractate}
        </span>
      </span>
      <span className="relative z-10 text-[10px] text-gold/70 sm:text-xs">
        {dafCount} {dafCount === 1 ? 'daf' : 'dapim'}
      </span>
    </button>
  );
}
