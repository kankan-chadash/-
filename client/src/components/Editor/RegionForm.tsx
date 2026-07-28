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
import type { ContentType } from '../../types';
import type { EditableRegion } from './types';

interface RegionFormProps {
  region: EditableRegion;
  onChange: (region: EditableRegion) => void;
  onDelete: () => void;
}

export function RegionForm({ region, onChange, onDelete }: RegionFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-wood-dark">
          {region.shape === 'rectangle' ? 'אזור מלבני' : 'אזור מצולע'}
        </h3>
        <button type="button" onClick={onDelete} className="text-red-600 text-sm hover:underline">
          מחיקת אזור
        </button>
      </div>

      <label className="block">
        <span className="text-sm text-ink-variant">כותרת (רשות)</span>
        <input
          value={region.title ?? ''}
          onChange={(e) => onChange({ ...region, title: e.target.value || null })}
          placeholder="הכותרת שתוצג בחלון הקופץ"
          className="mt-1 w-full rounded border border-outline bg-white px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm text-ink-variant">סוג התוכן</span>
        <select
          value={region.contentType}
          onChange={(e) => onChange({ ...region, contentType: e.target.value as ContentType })}
          className="mt-1 w-full rounded border border-outline bg-white px-3 py-2"
        >
          <option value="text">טקסט</option>
          <option value="image">תמונה</option>
          <option value="video">סרטון</option>
        </select>
      </label>

      {region.contentType === 'text' && (
        <label className="block">
          <span className="text-sm text-ink-variant">תוכן טקסט / HTML</span>
          <textarea
            value={region.content}
            onChange={(e) => onChange({ ...region, content: e.target.value })}
            rows={6}
            placeholder="ההסבר שיוצג בלחיצה על האזור"
            className="mt-1 w-full rounded border border-outline bg-white px-3 py-2 font-mono text-sm"
          />
        </label>
      )}

      {region.contentType === 'image' && (
        <label className="block">
          <span className="text-sm text-ink-variant">כתובת תמונה</span>
          <input
            value={region.content}
            onChange={(e) => onChange({ ...region, content: e.target.value })}
            placeholder="https://... או /uploads/..."
            className="mt-1 w-full rounded border border-outline bg-white px-3 py-2"
          />
        </label>
      )}

      {region.contentType === 'video' && (
        <label className="block">
          <span className="text-sm text-ink-variant">כתובת סרטון (YouTube / Vimeo)</span>
          <input
            value={region.content}
            onChange={(e) => onChange({ ...region, content: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="mt-1 w-full rounded border border-outline bg-white px-3 py-2"
          />
        </label>
      )}
    </div>
  );
}
