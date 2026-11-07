import Link from "next/link";
import { Credit, Photo } from "@/components/photo";
import type { Journey } from "@/lib/catalog";
import { money } from "@/lib/price";

export function JourneyRow({ journey, nextDate }: { journey: Journey; nextDate?: string | null }) {
  return (
    <article className="row-link">
      <Link href={`/journeys/${journey.slug}`}>
        <div className="frame">
          <Photo photo={journey.cover} sizes="(max-width: 1024px) 100vw, 40vw" />
        </div>
      </Link>
      <div>
        <p className="eyebrow">
          {journey.place}, {journey.country} · {journey.nights} nights
        </p>
        <h2 className="display">
          <Link href={`/journeys/${journey.slug}`}>{journey.title}</Link>
        </h2>
        <p>{journey.summary}</p>
        <p className="muted">
          From {money(journey.price)} · {journey.manner}
          {nextDate ? ` · Next ${nextDate}` : ""}
        </p>
        <Credit photo={journey.cover} />
      </div>
    </article>
  );
}
