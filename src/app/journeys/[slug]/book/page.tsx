import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { holdSeats } from "@/lib/actions";
import { currentUser } from "@/lib/auth";
import { journey as findJourney } from "@/lib/catalog";
import { listDepartures } from "@/lib/desk";
import { formatDate, money } from "@/lib/price";

export const metadata: Metadata = { title: "Request a departure" };
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
      <main className="wrap page-hero">
        <p className="eyebrow">01 · Hold seats</p>
        <h1 className="display">{trip.title}</h1>
        <p className="lede">From {money(trip.price)} per adult. Seats are held for 20 minutes while you review. The test desk does not charge a card.</p>
        {query.error ? <p className="error">{query.error}</p> : null}
        {departures.length === 0 ? (
          <p>No open departures remain. <Link href="/bespoke">Ask for a private date.</Link></p>
        ) : (
          <form className="stack-form" action={holdSeats}>
            <input type="hidden" name="journey" value={trip.slug} />
            <fieldset className="field">
              <legend className="eyebrow">Departure</legend>
              {departures.map((departure) => (
                <label key={departure.id} className="check">
                  <input type="radio" name="departure" value={departure.id} required defaultChecked={departure.id === departures[0].id} />
                  <span>{formatDate(departure.date)} · {departure.remaining} seats</span>
                </label>
              ))}
            </fieldset>
            <div className="two">
              <label className="field"><span>Adults</span><input name="adults" type="number" min={1} max={8} defaultValue={2} required /></label>
              <label className="field"><span>Children</span><input name="children" type="number" min={0} max={6} defaultValue={0} required /></label>
            </div>
            <fieldset className="field">
              <legend className="eyebrow">Add-ons</legend>
              {trip.addons.map((addon) => (
                <label key={addon.id} className="check">
                  <input type="checkbox" name="addon" value={addon.id} />
                  <span>{addon.name} · {money(addon.price)}</span>
                </label>
              ))}
            </fieldset>
            <label className="field"><span>Code</span><input name="promo" placeholder="AURA10 or WELCOME500" /></label>
            <label className="field"><span>Your name</span><input name="contactName" required defaultValue={user?.name ?? ""} /></label>
            <label className="field"><span>Email</span><input name="email" type="email" required defaultValue={user?.email ?? ""} /></label>
            <fieldset className="field">
              <legend className="eyebrow">Guest names</legend>
              {Array.from({ length: 8 }, (_, index) => (
                <input key={index} name="traveler" placeholder={index === 0 ? "Lead guest" : `Guest ${index + 1}, if traveling`} aria-label={`Guest ${index + 1}`} />
              ))}
            </fieldset>
            <button className="button" type="submit">Hold these seats</button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
