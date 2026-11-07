import { notFound } from "next/navigation";
import { cancelTrip, refundTrip } from "@/lib/actions";
import { journey } from "@/lib/catalog";
import { getBooking } from "@/lib/desk";
import { money } from "@/lib/price";

export default async function AdminBooking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = getBooking(id);
  if (!booking) notFound();
  const trip = journey(booking.journeySlug);

  return (
    <>
      <p className="eyebrow">{booking.reference}{booking.demo ? " · demo" : ""}</p>
      <h1 className="display" style={{ fontSize: 46 }}>{trip?.title}</h1>
      <p>{booking.status} · {money(booking.total)} · {booking.email}</p>
      <ul>{booking.travelers.map((traveler) => <li key={traveler.name}>{traveler.name}</li>)}</ul>
      <h2>History</h2>
      <ul>{booking.events.map((event) => <li key={event.at + event.note}>{event.at} · {event.from} → {event.to} · {event.note}</li>)}</ul>
      {booking.status === "Confirmed" || booking.status === "Held" ? (
        <form action={cancelTrip}>
          <input type="hidden" name="reference" value={booking.reference} />
          <input type="hidden" name="return" value="admin" />
          <button className="button" type="submit">Cancel</button>
        </form>
      ) : null}
      {booking.status === "Cancelled" ? (
        <form action={refundTrip}>
          <input type="hidden" name="reference" value={booking.reference} />
          <button className="button" type="submit">Record refund</button>
        </form>
      ) : null}
    </>
  );
}
