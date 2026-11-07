"use client";

import { useState } from "react";
import { Credit, Photo } from "@/components/photo";
import type { Photo as PhotoType } from "@/lib/catalog";

export function ShotGallery({ photos }: { photos: PhotoType[] }) {
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];
  if (!current) return null;

  return (
    <div className="shot">
      <div className="frame shot-main">
        <Photo photo={current} priority sizes="(max-width: 1024px) 100vw, 58vw" />
      </div>
      {photos.length > 1 ? (
        <div className="thumbs">
          {photos.slice(0, 4).map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              className={index === active ? "on" : undefined}
              aria-label={photo.alt}
              onClick={() => setActive(index)}
            >
              <span className="frame">
                <Photo photo={photo} sizes="120px" />
              </span>
            </button>
          ))}
        </div>
      ) : null}
      <Credit photo={current} />
    </div>
  );
}
