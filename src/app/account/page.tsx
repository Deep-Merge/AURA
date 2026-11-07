import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { journey } from "@/lib/catalog";
import { bookingsForEmail, favoritesFor } from "@/lib/desk";
import { money } from "@/lib/price";

export default async function AccountHome() {
  const user = await currentUser();
  if (!user) return null;
  const trips = bookingsForEmail(user.email).filter((item) => !item.demo || item.userId === user.id);
  const upcoming = trips.filter((item) => item.status === "Confirmed" || item.status === "Held");
  const saved = favoritesFor(user.id);

  return (
    <>
      <p className="banner">Demo data where a booking was seeded</p>
      <h1 className="display" style={{ fontSize: 56 }}>Hello, {user.name.split(" ")[0]}.</h1>
      <div className="stats">
        <div className="stat"><b>{upcoming.length}</b>Open trips</div>
        <div className="stat"><b>{saved.length}</b>Saved</div>
        <div className="stat"><b>{user.travelers.length}</b>Travelers</div>
      </div>
      <h2>Upcoming</h2>
      {upcoming.length === 0 ? <p>No open trip. <Link href="/journeys">Look at the journeys.</Link></p> : upcoming.slice(0, 4).map((item) => (
        <p key={item.reference}><Link href={`/account/trips/${item.reference}`}>{item.reference}</Link> · {journey(item.journeySlug)?.title} · {item.status} · {money(item.total)}</p>
      ))}
    </>
  );
}
