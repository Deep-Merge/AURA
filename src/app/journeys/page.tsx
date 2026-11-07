import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Combo } from "@/components/combo";
import { JourneyRow } from "@/components/journey-row";
import { catalog, styles } from "@/lib/catalog";
import { nextOpen } from "@/lib/desk";
import { formatDate } from "@/lib/price";

export const metadata: Metadata = { title: "Journeys" };
export const dynamic = "force-dynamic";

export default async function JourneysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const q = (query.q ?? "").trim().toLowerCase();
  const list = catalog.journeys.filter((item) => {
    if (query.destination && item.destination !== query.destination) return false;
    if (query.region && item.region !== query.region) return false;
    if (query.style && item.style !== query.style) return false;
    if (query.manner && item.manner !== query.manner) return false;
    if (query.month && !item.departures.some((departure) => departure.date.startsWith(query.month!))) return false;
    if (q && !`${item.title} ${item.place} ${item.country} ${item.summary}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const sorted = [...list].sort((a, b) => {
    if (query.sort === "price") return a.price - b.price;
    if (query.sort === "price-desc") return b.price - a.price;
    if (query.sort === "nights") return a.nights - b.nights;
    return a.title.localeCompare(b.title);
  });

  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">Journeys</p>
        <h1 className="display">Fifty journeys. One pace.</h1>
        <form className="filters" action="/journeys">
          <input name="q" defaultValue={query.q ?? ""} aria-label="Search" placeholder="Search" />
          <Combo name="destination" label="Destination" defaultValue={query.destination ?? ""} options={[{ value: "", label: "All destinations" }, ...catalog.destinations.map((item) => ({ value: item.slug, label: item.name }))]} />
          <Combo name="region" label="Region" defaultValue={query.region ?? ""} options={[{ value: "", label: "All regions" }, ...catalog.regions.map((region) => ({ value: region, label: region }))]} />
          <Combo name="style" label="Style" defaultValue={query.style ?? ""} options={[{ value: "", label: "All styles" }, ...styles.map((style) => ({ value: style, label: style }))]} />
          <Combo name="manner" label="Private or group" defaultValue={query.manner ?? ""} options={[{ value: "", label: "Private or group" }, { value: "Private", label: "Private" }, { value: "Small group", label: "Small group" }]} />
          <Combo name="month" label="Departure month" defaultValue={query.month ?? ""} options={[{ value: "", label: "Any month" }, { value: "2026-12", label: "December 2026" }, { value: "2027-01", label: "January 2027" }, { value: "2027-03", label: "March 2027" }, { value: "2027-06", label: "June 2027" }]} />
          <Combo name="sort" label="Sort" defaultValue={query.sort ?? ""} options={[{ value: "", label: "Recommended" }, { value: "price", label: "Price, low to high" }, { value: "price-desc", label: "Price, high to low" }, { value: "nights", label: "Duration" }]} />
          <button className="button" type="submit">Show</button>
          <a href="/journeys">Reset</a>
        </form>
        {sorted.length === 0 ? (
          <p>Nothing matches those filters. <a href="/journeys">Clear them</a> and look again.</p>
        ) : (
          <div className="rows">
            {sorted.map((item) => {
              const next = nextOpen(item.slug);
              return <JourneyRow key={item.slug} journey={item} nextDate={next ? formatDate(next.date) : null} />;
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
