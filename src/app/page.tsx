import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Combo } from "@/components/combo";
import { IndexSwitch } from "@/components/index-switch";
import { Credit, Photo } from "@/components/photo";
import { catalog, hero, journeysFor } from "@/lib/catalog";
import { money } from "@/lib/price";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ joined?: string }> }) {
  const query = await searchParams;
  const opening = hero("hero-amalfi");
  const portrait = catalog.destinations.find((item) => item.slug === "japan")?.gallery.find((item) => item.role === "detail")
    ?? catalog.destinations[2].hero;
  const featured = ["amalfi-coast", "masai-mara"].map((slug) => catalog.journeys.find((item) => item.slug === slug)!);
  const articles = catalog.journal.slice(0, 3);

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-media">
            <Photo photo={opening} priority sizes="100vw" />
          </div>
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="eyebrow">Curated Journeys</p>
            <h1 className="display">Extraordinary places. Unforgettable journeys.</h1>
            <p className="support">Thoughtfully curated escapes for those who believe the journey should be as remarkable as the destination.</p>
            <div className="actions">
              <Link className="button light" href="/journeys">View journeys</Link>
              <Link className="text-link" href="/bespoke">Plan a private journey</Link>
            </div>
            <form className="searchline" action="/journeys">
              <input name="q" aria-label="Where" placeholder="Where" />
              <Combo
                name="month"
                label="When"
                options={[
                  { value: "", label: "When" },
                  { value: "2026-12", label: "December 2026" },
                  { value: "2027-01", label: "January 2027" },
                  { value: "2027-03", label: "March 2027" },
                  { value: "2027-06", label: "June 2027" },
                ]}
              />
              <Combo
                name="manner"
                label="How you travel"
                options={[
                  { value: "", label: "Private or group" },
                  { value: "Private", label: "Private" },
                  { value: "Small group", label: "Small group" },
                ]}
              />
              <button type="submit">Search</button>
            </form>
            {query.joined ? <p className="support">You are on the list.</p> : null}
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">Destinations</p>
                <h2 className="display">Twenty places, chosen slowly.</h2>
              </div>
              <Link href="/destinations">All destinations</Link>
            </div>
            <IndexSwitch
              label="Destinations"
              items={catalog.destinations.map((item) => ({
                href: `/destinations/${item.slug}`,
                title: item.name,
                meta: `${item.country} · ${journeysFor(item.slug).length} journeys`,
                image: item.hero!,
              }))}
            />
          </div>
        </section>

        {featured.map((item, index) => (
          <section className="section" key={item.slug}>
            <div className="wrap">
              <div className={index === 1 ? "split reverse" : "split"}>
                <div className="frame">
                  <Photo photo={item.cover} sizes="(max-width: 1024px) 100vw, 60vw" />
                </div>
                <div className="split-copy">
                  <p className="eyebrow">{item.place} · {item.nights} nights</p>
                  <h2 className="display">{item.title}</h2>
                  <p>{item.overview}</p>
                  <p className="muted">From {money(item.price)} per adult · {item.manner}</p>
                  <div className="actions">
                    <Link className="button" href={`/journeys/${item.slug}`}>View journey</Link>
                  </div>
                  <Credit photo={item.cover} />
                </div>
              </div>
            </div>
          </section>
        ))}

        <section className="section band">
          <div className="wrap philosophy">
            <div className="frame">
              <Photo photo={portrait} sizes="(max-width: 1024px) 100vw, 40vw" />
            </div>
            <div>
              <p className="eyebrow">The house style</p>
              <h2 className="display">Fewer places. Better hours.</h2>
              <p className="lede">
                AURA plans private journeys and small departures. One region is enough. A day with nothing written on it is a feature, not a gap. We do not sell flights or pretend a hotel chain is a partner.
              </p>
              <Link className="text-link" href="/our-approach">How we plan</Link>
              <Credit photo={portrait} />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">Collections</p>
                <h2 className="display">A shorter way in.</h2>
              </div>
            </div>
            <IndexSwitch
              label="Collections"
              items={catalog.collections.map((item) => ({
                href: `/collections/${item.slug}`,
                title: item.name,
                meta: `${item.journeySlugs.length} journeys`,
                image: item.image,
              }))}
            />
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">Journal</p>
                <h2 className="display">Notes from the road.</h2>
              </div>
              <Link href="/journal">All stories</Link>
            </div>
            <div className="journal-grid">
              <article className="story">
                <Link href={`/journal/${articles[0].slug}`}>
                  <div className="frame">
                    <Photo photo={articles[0].image} sizes="(max-width: 1024px) 100vw, 60vw" />
                  </div>
                  <h2 className="display" style={{ fontSize: 42 }}>{articles[0].title}</h2>
                </Link>
                <Credit photo={articles[0].image} />
              </article>
              <div className="journal-side">
                {articles.slice(1).map((item) => (
                  <Link key={item.slug} href={`/journal/${item.slug}`}>
                    <h3>{item.title}</h3>
                    <p className="muted">{item.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <p className="eyebrow">Bespoke</p>
            <h2 className="display" style={{ maxWidth: "16ch" }}>If the date or the shape is yours alone, write to the desk.</h2>
            <div className="actions">
              <Link className="button" href="/bespoke">Begin an enquiry</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer credit={opening.credit} />
    </>
  );
}
