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
import { Link, useLocation, useParams } from 'react-router-dom';
import { isGithubAdminMode, useAdminApi } from '../../api/adminData';
import type { PageWithRegions } from '../../types';
import { DrawingCanvas } from '../../components/Editor/DrawingCanvas';
import type { EditorMode } from '../../components/Editor/DrawingCanvas';
import type { EditableRegion } from '../../components/Editor/types';
import { RegionForm } from '../../components/Editor/RegionForm';
import { RegionList } from '../../components/Editor/RegionList';
import { formatDaf } from '../../utils/library';

const MODE_LABELS: Record<EditorMode, string> = {
  select: 'בחירה',
  rectangle: 'מלבן',
  polygon: 'מצולע',
};

export function AdminPageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const location = useLocation() as { state?: { previewImageUrl?: string } };
  const previewImageUrl = location.state?.previewImageUrl;
  const api = useAdminApi();
  const [page, setPage] = useState<PageWithRegions | null>(null);
  const [regions, setRegions] = useState<EditableRegion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>('select');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (!pageId) return;
    api
      .fetchAdminPage(pageId)
      .then((p) => {
        setPage(p);
        setRegions(p.regions.map((r) => ({ ...r })));
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, api]);

  const selectedRegion = regions.find((r) => r.id === selectedId) ?? null;

  function updateRegions(updater: (regs: EditableRegion[]) => EditableRegion[]) {
    setRegions(updater);
    setStatus('idle');
  }

  function updateSelectedRegion(next: EditableRegion) {
    updateRegions((regs) => regs.map((r) => (r.id === next.id ? next : r)));
  }

  function deleteRegion(id: string) {
    updateRegions((regs) => regs.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function handleSave() {
    if (!pageId) return;
    setStatus('saving');
    setError(null);
    try {
      const saved = await api.saveRegions(pageId, regions);
      setPage(saved);
      setRegions(saved.regions.map((r) => ({ ...r })));
      setStatus('saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירת האזורים נכשלה');
      setStatus('idle');
    }
  }

  if (error && !page) {
    return (
      <div className="min-h-screen bg-wood flex items-center justify-center">
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wood">
      <header className="border-b-2 border-gold/40 bg-wood-dark">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/admin" className="text-parchment/80 hover:text-gold text-sm">
            → כל הדפים
          </Link>
          {page && (
            <h1 className="font-serif text-xl text-parchment">
              <bdi>{page.tractate}</bdi> {formatDaf(page)} — עורך אזורים
            </h1>
          )}
          <button
            onClick={handleSave}
            disabled={status === 'saving'}
            className="rounded bg-gold text-wood-dark px-4 py-2 font-semibold hover:brightness-95 transition disabled:opacity-60"
          >
            {status === 'saving' ? 'שומר…' : status === 'saved' ? 'נשמר ✓' : 'שמירת אזורים'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section>
          {previewImageUrl && isGithubAdminMode && (
            <p className="mb-3 text-xs text-parchment/70">
              מוצגת תצוגה מקומית של התמונה שהעליתם — היא תהיה זמינה בכתובת האמיתית שלה בתום
              הפריסה הבאה של GitHub Pages (כדקה). אם תרעננו את הדף לפני כן, התמונה לא תוצג עד אז.
            </p>
          )}
          <div className="mb-3 flex gap-2">
            {(['select', 'rectangle', 'polygon'] as EditorMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded text-sm font-medium border ${
                  mode === m
                    ? 'bg-gold text-wood-dark border-gold'
                    : 'bg-parchment text-ink border-outline hover:border-gold'
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
            <p className="ms-2 self-center text-xs text-parchment/70">
              {mode === 'rectangle' && 'גררו על התמונה כדי לסמן מלבן.'}
              {mode === 'polygon' &&
                'הקישו כדי להוסיף נקודות, ואז לחצו על "סיום הצורה". אפשר גם לסגור בהקשה חוזרת על הנקודה הראשונה, בלחיצה כפולה או ב-Enter.'}
              {mode === 'select' && 'הקישו על אזור כדי לערוך אותו. גררו כדי להזיז, וגררו את הידיות כדי לשנות גודל.'}
            </p>
          </div>

          <div className="bg-parchment rounded shadow-2xl border-t-4 border-gold overflow-hidden">
            {page && (
              <DrawingCanvas
                imageUrl={previewImageUrl ?? page.pageImageUrl}
                regions={regions}
                selectedId={selectedId}
                mode={mode}
                onSelect={setSelectedId}
                onRegionsChange={updateRegions}
                onRegionCreated={(region) => setSelectedId(region.id)}
                onModeChange={setMode}
              />
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="bg-parchment rounded shadow-lg border-t-4 border-gold p-5">
            <h2 className="font-serif text-lg text-wood-dark mb-3">אזורים ({regions.length})</h2>
            <RegionList regions={regions} selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          {selectedRegion && (
            <div className="bg-parchment rounded shadow-lg border-t-4 border-gold p-5">
              <RegionForm
                region={selectedRegion}
                onChange={updateSelectedRegion}
                onDelete={() => deleteRegion(selectedRegion.id)}
              />
            </div>
          )}

          {error && <p className="text-red-300 text-sm">{error}</p>}
        </aside>
      </main>
    </div>
  );
}
