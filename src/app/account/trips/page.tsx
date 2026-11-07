import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { journey } from "@/lib/catalog";
import { bookingsForEmail } from "@/lib/desk";
import { money } from "@/lib/price";

export default async function TripsPage() {
  const user = await currentUser();
  if (!user) return null;
  const trips = bookingsForEmail(user.email);

  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Trips</h1>
      <table className="table">
        <thead><tr><th>Reference</th><th>Journey</th><th>Status</th><th>Total</th></tr></thead>
        <tbody>
          {trips.map((item) => (
            <tr key={item.reference}>
              <td><Link href={`/account/trips/${item.reference}`}>{item.reference}</Link></td>
              <td>{journey(item.journeySlug)?.title}</td>
              <td>{item.status}{item.demo ? " · demo" : ""}</td>
              <td>{money(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
