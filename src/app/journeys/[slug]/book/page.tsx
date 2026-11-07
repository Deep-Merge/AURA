import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HoldForm } from "@/components/hold-form";
import { Credit, Photo } from "@/components/photo";
import { currentUser } from "@/lib/auth";
import { journey as findJourney } from "@/lib/catalog";
import { listDepartures } from "@/lib/desk";

export const metadata: Metadata = { title: "Hold seats" };
export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const trip = findJourney(slug);
  if (!trip) notFound();
  const user = await currentUser();
  const departures = listDepartures(slug).filter((item) => item.remaining > 0);

  return (
    <>
      <Header solid />
      <main className="wrap product-page">
        <p className="crumbs">
          <Link href="/journeys">Journeys</Link>
          <span>/</span>
          <Link href={`/journeys/${trip.slug}`}>{trip.title}</Link>
          <span>/</span>
          Hold seats
        </p>

        <div className="hold-gallery">
          <figure>
            <div className="frame">
              <Photo photo={trip.cover} priority sizes="(max-width: 767px) 100vw, 70vw" />
            </div>
            <Credit photo={trip.cover} />
          </figure>
          <figure>
            <div className="frame">
              <Photo photo={trip.detail} sizes="(max-width: 767px) 100vw, 30vw" />
            </div>
            <Credit photo={trip.detail} />
          </figure>
        </div>

        {departures.length === 0 ? (
          <section className="hold-card">
            <h1>{trip.title}</h1>
            <p>No open departures remain. <Link href="/bespoke">Ask for a private date.</Link></p>
          </section>
        ) : (
          <HoldForm
            slug={trip.slug}
            title={trip.title}
            place={trip.place}
            country={trip.country}
            nights={trip.nights}
            price={trip.price}
            style={trip.style}
            manner={trip.manner}
            summary={trip.summary}
            addons={trip.addons}
            departures={departures.map((item) => ({ id: item.id, date: item.date, remaining: item.remaining }))}
            contactName={user?.name ?? ""}
            email={user?.email ?? ""}
            error={query.error}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
