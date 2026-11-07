import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelTrip } from "@/lib/actions";
import { currentUser } from "@/lib/auth";
import { journey } from "@/lib/catalog";
import { getBooking } from "@/lib/desk";
import { money } from "@/lib/price";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const booking = getBooking(id);
  if (!user || !booking || booking.email !== user.email) notFound();
  const trip = journey(booking.journeySlug);

  return (
    <>
      <p className="eyebrow">{booking.reference}{booking.demo ? " · demo" : ""}</p>
      <h1 className="display" style={{ fontSize: 48 }}>{trip?.title}</h1>
      <p>{booking.status} · {money(booking.total)}</p>
      {booking.payment ? <p>{booking.payment.label}</p> : null}
      <h2>Guests</h2>
      <ul>{booking.travelers.map((traveler) => <li key={traveler.name}>{traveler.name}</li>)}</ul>
      <h2>Itinerary</h2>
      <ol>{trip?.days.map((day) => <li key={day.title}><strong>{day.title}.</strong> {day.body}</li>)}</ol>
      <p>{trip?.cancellation}</p>
      {booking.status === "Confirmed" || booking.status === "Held" ? (
        <form action={cancelTrip}>
          <input type="hidden" name="reference" value={booking.reference} />
          <button className="text-link" type="submit">Cancel this booking</button>
        </form>
      ) : null}
      <p><Link href={`/journeys/${booking.journeySlug}`}>Journey page</Link></p>
    </>
  );
}
