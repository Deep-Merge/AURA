import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { payTest } from "@/lib/actions";
import { journey as findJourney } from "@/lib/catalog";
import { getBooking } from "@/lib/desk";
import { money } from "@/lib/price";

export const metadata: Metadata = { title: "Booking" };
export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { reference } = await params;
  const query = await searchParams;
  const booking = getBooking(reference);
  if (!booking) notFound();
  const trip = findJourney(booking.journeySlug);

  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">{booking.reference}</p>
        <h1 className="display">{trip?.title ?? "Journey"}</h1>
        <p className="banner">Test desk · no card is charged</p>
        {query.error ? <p className="error">{query.error}</p> : null}
        <div className="detail-card" style={{ maxWidth: 640 }}>
          <p>Status · {booking.status}</p>
          <p>{booking.adults} adults{booking.children ? `, ${booking.children} children` : ""} · {money(booking.total)}</p>
          <ul>
            {booking.travelers.map((traveler) => <li key={traveler.name}>{traveler.name} · {traveler.kind}</li>)}
          </ul>
          {booking.addons.map((addon) => <p key={addon.id}>{addon.name} · {money(addon.price)}</p>)}
          {booking.payment ? <p>{booking.payment.label}</p> : null}
          {booking.status === "Held" || booking.status === "Pending Payment" ? (
            <form action={payTest}>
              <input type="hidden" name="reference" value={booking.reference} />
              <button className="button" type="submit">Confirm test payment</button>
            </form>
          ) : null}
          {booking.status === "Confirmed" ? <p>The seats are confirmed in the local desk. <Link href={`/account/trips/${booking.reference}`}>Open the trip</Link></p> : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
