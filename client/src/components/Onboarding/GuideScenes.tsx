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
import logoUrl from '../../assets/logo.png';

// Each step of the guide is illustrated with a miniature of the thing it is
// describing, built from the same surfaces the real screens use. Showing the
// actual shelf and the actual daf beats any generic icon set.

export function SceneWelcome() {
  return (
    <div className="guide-scene items-center justify-center">
      <img src={logoUrl} alt="" className="h-24 w-24 rounded-lg bg-parchment/95 p-2 shadow-xl" />
      <span aria-hidden className="guide-glow" />
    </div>
  );
}

export function SceneLibrary() {
  return (
    <div className="guide-scene items-end justify-center gap-1.5 pb-6">
      {[
        { leather: 'leather-red', h: 62 },
        { leather: 'leather-brown', h: 74, active: true },
        { leather: 'leather-blue', h: 56 },
        { leather: 'leather-green', h: 68 },
      ].map((b, i) => (
        <span
          key={i}
          className={`mini-spine ${b.leather} ${b.active ? 'mini-spine-active' : ''}`}
          style={{ height: `${b.h}%` }}
        />
      ))}
      <span aria-hidden className="mini-plank" />
    </div>
  );
}

export function SceneRegions() {
  return (
    <div className="guide-scene items-center justify-center">
      <span className="mini-daf">
        {[16, 30, 44, 58, 72].map((top) => (
          <span key={top} className="mini-line" style={{ top: `${top}%` }} />
        ))}
        <span className="mini-region" />
        <span aria-hidden className="mini-cursor" />
      </span>
    </div>
  );
}

export function SceneTurning() {
  return (
    <div className="guide-scene items-center justify-center">
      <span className="mini-book">
        <span className="mini-daf mini-daf-static" />
        <span className="mini-daf mini-daf-turning" />
      </span>
    </div>
  );
}

export function SceneVideos() {
  return (
    <div className="guide-scene items-start justify-center pt-5">
      <span className="mini-rail">
        <span className="mini-beam" />
        <span className="mini-plaques">
          {[0, 1, 2].map((i) => (
            <span key={i} className="mini-plaque" style={{ animationDelay: `${i * 160}ms` }}>
              <span className="mini-play">▶</span>
            </span>
          ))}
        </span>
      </span>
    </div>
  );
}
