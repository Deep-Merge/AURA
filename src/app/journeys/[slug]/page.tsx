import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ShotGallery } from "@/components/shot-gallery";
import { saveJourney } from "@/lib/actions";
import { currentUser } from "@/lib/auth";
import { destination, journey as findJourney, journeysFor, type Photo } from "@/lib/catalog";
import { isSaved, nextOpen } from "@/lib/desk";
import { formatDate, money } from "@/lib/price";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const trip = findJourney(slug);
  return { title: trip?.title ?? "Journey", description: trip?.summary };
}

function uniqueShots(photos: Photo[]) {
  const seen = new Set<string>();
  return photos.filter((photo) => {
    if (seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });
}

export default async function JourneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = findJourney(slug);
  if (!trip) notFound();
  const place = destination(trip.destination);
  const user = await currentUser();
  const saved = isSaved(user?.id ?? null, trip.slug);
  const next = nextOpen(trip.slug);
  const related = journeysFor(trip.destination).filter((item) => item.slug !== trip.slug).slice(0, 3);
  const shots = uniqueShots([trip.cover, trip.detail, ...(place?.gallery ?? [])]).slice(0, 5);

  return (
    <>
      <Header />
      <main className="wrap product-page">
        <p className="crumbs">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/journeys">Journeys</Link>
          <span>/</span>
          {trip.title}
        </p>

        <div className="product">
          <ShotGallery photos={shots} />
          <aside className="book-card">
            <h1>{trip.title}</h1>
            <p className="price-kicker">Starting from</p>
            <p className="price">
              {money(trip.price)} <span>per adult</span>
            </p>
            <dl className="facts">
              <div>
                <dt>Duration</dt>
                <dd>{trip.nights} nights</dd>
              </div>
              <div>
                <dt>Group</dt>
                <dd>{trip.group}</dd>
              </div>
              <div>
                <dt>Style</dt>
                <dd>{trip.style}</dd>
              </div>
              <div>
                <dt>How you travel</dt>
                <dd>{trip.manner}</dd>
              </div>
            </dl>
            <div className="book-box">
              <p className="eyebrow">Book this journey</p>
              {next ? (
                <p>
                  Next departure {formatDate(next.date)} · {next.remaining} seats open
                </p>
              ) : (
                <p>No published date is open. The desk can plan a private departure.</p>
              )}
              <p className="muted">Children travel at 70% of the adult price. The test desk does not charge a card.</p>
              <Link className="button" href={`/journeys/${trip.slug}/book`}>
                Book this journey
              </Link>
              <form action={saveJourney}>
                <input type="hidden" name="slug" value={trip.slug} />
                <button className="text-link" type="submit">
                  {saved ? "Saved" : "Save this journey"}
                </button>
              </form>
            </div>
          </aside>
        </div>

        <section className="product-block">
          <h2>Journey overview</h2>
          <p className="lede">{trip.overview}</p>
          <p className="muted">{trip.stay} {trip.transport}</p>
        </section>

        <section className="product-block">
          <h2>Your journey</h2>
          <ol className="timeline">
            {trip.days.map((day, index) => (
              <li key={`${day.title}-${index}`}>
                <span>Day {String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{day.title}</strong>
                  <p>{day.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="product-block two">
          <div className="info-card">
            <h2>Included</h2>
            <ul>
              {trip.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="info-card">
            <h2>Not included</h2>
            <ul>
              {trip.excluded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{trip.cancellation}</p>
          </div>
        </section>

        <section className="product-block">
          <h2>Questions</h2>
          <div className="faqs">
            {trip.faqs.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 ? (
          <section className="product-block">
            <h2>Also in {trip.place}</h2>
            <div className="related">
              {related.map((item) => (
                <Link key={item.slug} href={`/journeys/${item.slug}`}>
                  <strong>{item.title}</strong>
                  <span>
                    {item.nights} nights · from {money(item.price)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer credit={trip.cover.credit} />
    </>
  );
}
