"use client";

import Link from "next/link";
import { useState } from "react";
import { Credit, Photo } from "@/components/photo";
import type { Photo as PhotoType } from "@/lib/catalog";

type Item = {
  href: string;
  title: string;
  meta: string;
  image: PhotoType;
};

export function IndexSwitch({ items, label }: { items: Item[]; label: string }) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];
  if (!current) return null;

  return (
    <div className="index">
      <div className="index-names" role="listbox" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.href}
            type="button"
            className={index === active ? "on" : undefined}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
          >
            <strong>{item.title}</strong>
            <span>{item.meta}</span>
          </button>
        ))}
      </div>
      <div className="index-photo">
        <Link href={current.href}>
          <div className="frame">
            <Photo photo={current.image} sizes="(max-width: 1024px) 100vw, 60vw" />
          </div>
        </Link>
        <Credit photo={current.image} />
      </div>
    </div>
  );
}
