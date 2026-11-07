import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JourneyRow } from "@/components/journey-row";
import { catalog } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: decodeURIComponent(slug) };
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  const places = catalog.destinations.filter((item) => item.region === name);
  if (places.length === 0) notFound();
  const trips = catalog.journeys.filter((item) => item.region === name);

  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">Region</p>
        <h1 className="display">{name}</h1>
        <div className="two">
          <div>
            {places.map((place) => (
              <p key={place.slug}><Link href={`/destinations/${place.slug}`}>{place.name}</Link>, {place.country}</p>
            ))}
          </div>
        </div>
        <div className="rows" style={{ marginTop: 36 }}>
          {trips.map((item) => <JourneyRow key={item.slug} journey={item} />)}
        </div>
      </main>
      <Footer />
    </>
  );
}
