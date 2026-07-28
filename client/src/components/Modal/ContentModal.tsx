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
import { useEffect } from 'react';
import DOMPurify from 'dompurify';
import type { Region } from '../../types';
import { toEmbedUrl } from '../../utils/videoEmbed';

interface ContentModalProps {
  region: Region;
  onClose: () => void;
}

export function ContentModal({ region, onClose }: ContentModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={region.title ?? 'תוכן'}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded bg-parchment shadow-2xl border-t-4 border-gold"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          className="absolute top-3 end-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-wood text-parchment hover:bg-wood-dark transition"
        >
          ✕
        </button>

        <div className="p-6">
          {region.title && (
            <h3 className="font-serif text-2xl text-wood-dark mb-4 pe-8">{region.title}</h3>
          )}

          {region.contentType === 'video' && (
            <div className="aspect-video w-full">
              <iframe
                src={toEmbedUrl(region.content)}
                title={region.title ?? 'סרטון'}
                className="h-full w-full rounded"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {region.contentType === 'image' && (
            <img
              src={region.content}
              alt={region.title ?? 'איור'}
              className="max-h-[70vh] w-full rounded object-contain"
            />
          )}

          {region.contentType === 'text' && (
            <div
              className="max-w-none text-ink text-lg leading-relaxed [&_a]:text-wood-dark [&_a]:underline [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(region.content) }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
