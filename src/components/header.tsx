"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  ["Journeys", "/journeys"],
  ["Destinations", "/destinations"],
  ["Journal", "/journal"],
  ["Bespoke", "/bespoke"],
  ["Account", "/account"],
];

export function Header({ solid: _solid = true }: { solid?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header solid">
      <Link href="/" className="wordmark" aria-label="AURA, Curated Journeys">
        <strong>AURA</strong>
        <span>Curated Journeys</span>
      </Link>
      <nav className="nav" aria-label="Primary">
        {links.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <Link className="button nav-cta" href="/journeys">
        Book a journey
      </Link>
      <button className="menu-button" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? "Close" : "Menu"}
      </button>
      {open ? (
        <div className="nav-panel">
          <button type="button" onClick={() => setOpen(false)} style={{ justifySelf: "end", background: "none", border: 0 }}>
            Close
          </button>
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <Link className="button" href="/journeys" onClick={() => setOpen(false)}>
            Book a journey
          </Link>
        </div>
      ) : null}
    </header>
  );
}
