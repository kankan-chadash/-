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
import type { UpcomingBook } from '../../types';
import type { Book } from '../../utils/library';
import { chunkIntoShelves, formatDaf, spineStyle } from '../../utils/library';

const BOOKS_PER_SHELF = 8;

/** A published volume, or one merely announced — both stand on the shelf. */
export type ShelfEntry =
  | { kind: 'published'; key: string; book: Book }
  | { kind: 'upcoming'; key: string; item: UpcomingBook };

interface BookshelfProps {
  entries: ShelfEntry[];
}

export function Bookshelf({ entries }: BookshelfProps) {
  const shelves = chunkIntoShelves(entries, BOOKS_PER_SHELF);

  return (
    <div className="space-y-12">
      {shelves.map((shelf, shelfIndex) => (
        <section key={shelfIndex} aria-label={`מדף ${shelfIndex + 1}`} className="shelf-unit">
          <div className="shelf-back flex h-64 items-end justify-center gap-2 px-5 sm:h-80 sm:gap-3 sm:px-10">
            {shelf.map((entry, i) =>
              entry.kind === 'published' ? (
                <BookSpine
                  key={entry.key}
                  book={entry.book}
                  // A lone or nearly-lone volume leaning against nothing just looks broken.
                  leaning={i === shelf.length - 1 && shelf.length >= 3}
                />
              ) : (
                <UpcomingSpine key={entry.key} item={entry.item} />
              )
            )}
          </div>
          <div className="shelf-plank" />
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
      title={`${book.tractate} — נפתח בדף ${formatDaf(book.firstPage)}`}
      aria-label={`פתיחת ${book.tractate}, ${dafCount} ${dafCount === 1 ? 'דף' : 'דפים'}, החל מדף ${formatDaf(book.firstPage)}`}
      className={`book-spine ${style.leather} ${style.tilted ? 'rotate-3' : ''}`}
      style={{ height: `${style.heightPct}%`, width: `${style.widthPx}px` }}
    >
      <SpineDressing />
      <span className="spine-title-wrap">
        <span className="gold-embossed spine-title">{book.tractate}</span>
      </span>
      <span className="spine-foot">
        {dafCount} {dafCount === 1 ? 'דף' : 'דפים'}
      </span>
    </button>
  );
}

/**
 * An announced volume. It holds a real place on the shelf so the collection
 * reads as a set in progress, but it's faded, unclickable, and wears a
 * "בקרוב" band so nobody mistakes it for something they can open.
 */
function UpcomingSpine({ item }: { item: UpcomingBook }) {
  const style = spineStyle(item.tractate, false);

  return (
    <div
      className={`book-spine book-spine-upcoming ${style.leather}`}
      style={{ height: `${style.heightPct}%`, width: `${style.widthPx}px` }}
      title={item.note ? `${item.tractate} — ${item.note}` : `${item.tractate} — בקרוב`}
      aria-label={`${item.tractate} — בקרוב${item.note ? `, ${item.note}` : ''}`}
    >
      <SpineDressing />
      <span className="spine-title-wrap">
        <span className="spine-title text-parchment/75">{item.tractate}</span>
      </span>
      <span className="spine-foot text-parchment/55">{item.note ?? ' '}</span>
      <span className="spine-band" aria-hidden>
        בקרוב
      </span>
    </div>
  );
}

/** Raised bands and the curve of the binding — shared by both kinds of spine. */
function SpineDressing() {
  return (
    <>
      <span aria-hidden className="spine-rib" style={{ top: '14%' }} />
      <span aria-hidden className="spine-rib" style={{ top: '80%' }} />
      <span aria-hidden className="spine-curve" />
    </>
  );
}
