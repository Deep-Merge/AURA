import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { IndexSwitch } from "@/components/index-switch";
import { catalog, journeysFor } from "@/lib/catalog";

export const metadata: Metadata = { title: "Destinations" };

export default function DestinationsPage() {
  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">Destinations</p>
        <h1 className="display">Where the journeys live.</h1>
        <div style={{ height: 28 }} />
        <IndexSwitch
          label="Destinations"
          items={catalog.destinations.map((item) => ({
            href: `/destinations/${item.slug}`,
            title: item.name,
            meta: `${item.country} · ${journeysFor(item.slug).length}`,
            image: item.hero!,
          }))}
        />
      </main>
      <Footer />
    </>
  );
}
