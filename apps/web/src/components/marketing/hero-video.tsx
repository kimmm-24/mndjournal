"use client";

import { useEffect, useState } from "react";

// The hero's product demo: a looping motion graphic of the app (dark mode). Files live in
// public/media. The video's edges are exactly the hero background (#141820), so it sits on
// the page without a frame; the angled hand-off into the AI section starts below it.
//
// The video (4-5 MB) is only mounted where it plays: at sm (640px) and wider, with motion
// allowed. Phones and reduced-motion visitors get the still image and never request the video.
const VIDEO_QUERY = "(min-width: 640px) and (prefers-reduced-motion: no-preference)";

export function HeroVideo() {
  const [playVideo, setPlayVideo] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(VIDEO_QUERY);
    const update = () => setPlayVideo(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div className="relative -mt-24 sm:-mt-36">
      <div className="relative mx-auto max-w-6xl px-2 sm:px-6">
        <div className="relative aspect-video">
          {/* The image the server sends. The browser downloads only the source that matches:
              the video's first frame where the video will play, the full still elsewhere. */}
          <picture>
            <source media={VIDEO_QUERY} srcSet="/media/mndjournal-hero-dark-poster.jpg" />
            <img
              src="/media/mndjournal-hero-dark-still.jpg"
              alt="Dashboard mndjournal: Net P&L, win rate, profit factor dan grafik P&L kumulatif"
              width={1920}
              height={1080}
              className="block h-full w-full"
            />
          </picture>
          {playVideo && (
            <video
              className="absolute inset-0 block h-full w-full"
              width={1920}
              height={1080}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/media/mndjournal-hero-dark-poster.jpg"
              aria-label="Demo mndjournal: statistik trading otomatis, sync MetaTrader, kalender P&L harian, dan tanya jurnal ke AI"
            >
              <source src="/media/mndjournal-hero-dark.webm" type="video/webm" />
              <source src="/media/mndjournal-hero-dark.mp4" type="video/mp4" />
            </video>
          )}
        </div>
      </div>

      {/* Angled hand-off from the hero into the darker AI section below. */}
      <div aria-hidden className="relative h-16 sm:h-28">
        <div
          className="absolute inset-0 bg-[#0b0d13]"
          style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }}
        />
        <svg
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="hero-handoff-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#4d8dff" stopOpacity="0" />
              <stop offset="50%" stopColor="#4d8dff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#4d8dff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line
            x1="0"
            y1="10"
            x2="100"
            y2="0"
            stroke="url(#hero-handoff-line)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
