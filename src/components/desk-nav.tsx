"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DeskNav({
  label,
  links,
  children,
}: {
  label: string;
  links: [string, string][];
  children?: React.ReactNode;
}) {
  const path = usePathname();
  return (
    <nav aria-label={label}>
      <p className="eyebrow">{label}</p>
      {links.map(([href, name]) => {
        const current = href === "/account" || href === "/admin" ? path === href : path === href || path.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={current ? "on" : undefined} aria-current={current ? "page" : undefined}>
            {name}
          </Link>
        );
      })}
      {children}
    </nav>
  );
}
