import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JourneyRow } from "@/components/journey-row";
import { Credit, Photo } from "@/components/photo";
import { catalog, destination, journeysFor } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = destination(slug);
  return { title: place ? `${place.name}, ${place.country}` : "Destination", description: place?.summary };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = destination(slug);
  if (!place || !place.hero) notFound();
  const trips = journeysFor(place.slug);
  const others = catalogNeighbors(place.region, place.slug);

  return (
    <>
      <Header solid />
      <main>
        <div className="detail-hero">
          <div className="frame" style={{ height: "100%" }}>
            <Photo photo={place.hero} priority sizes="100vw" />
          </div>
        </div>
        <section className="wrap" style={{ paddingTop: 36 }}>
          <p className="eyebrow">{place.region} · {place.country}</p>
          <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 80px)" }}>{place.name}</h1>
          <p className="lede">{place.story}</p>
          <div className="two" style={{ marginTop: 28 }}>
            <p><strong>When to go. </strong>{place.bestTime}</p>
            <p><strong>How we plan it. </strong>{place.practical}</p>
          </div>
          <Credit photo={place.hero} />
        </section>
        <section className="section">
          <div className="wrap gallery">
            {place.gallery.slice(1, 3).map((image) => (
              <div className="frame" key={image.src}><Photo photo={image} sizes="50vw" /></div>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="wrap">
            <h2 className="display" style={{ fontSize: 48 }}>Journeys here</h2>
            <div className="rows">
              {trips.map((item) => <JourneyRow key={item.slug} journey={item} />)}
            </div>
            <h2 className="display" style={{ fontSize: 40, marginTop: 48 }}>Also in {place.region}</h2>
            {others.map((item) => (
              <p key={item.slug}><Link href={`/destinations/${item.slug}`}>{item.name}</Link>, {item.country}</p>
            ))}
            <p><Link href={`/regions/${encodeURIComponent(place.region)}`}>All of {place.region}</Link></p>
          </div>
        </section>
      </main>
      <Footer credit={place.hero.credit} />
    </>
  );
}

function catalogNeighbors(region: string, slug: string) {
  return catalog.destinations.filter((item) => item.region === region && item.slug !== slug).slice(0, 4);
}
