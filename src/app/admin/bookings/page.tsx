import Link from "next/link";
import { Combo } from "@/components/combo";
import { journey } from "@/lib/catalog";
import { snapshot } from "@/lib/desk";
import { money } from "@/lib/price";

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const query = await searchParams;
  const { desk } = snapshot();
  const rows = desk.bookings.filter((item) => !query.status || item.status === query.status);

  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Bookings</h1>
      <form className="filters" action="/admin/bookings">
        <Combo name="status" label="Status" defaultValue={query.status ?? ""} options={[{ value: "", label: "All statuses" }, ...["Held", "Confirmed", "Completed", "Cancelled", "Refunded", "Expired", "Pending Payment"].map((status) => ({ value: status, label: status }))]} />
        <button className="button" type="submit">Filter</button>
      </form>
      <table className="table">
        <thead><tr><th>Reference</th><th>Journey</th><th>Guest</th><th>Status</th><th>Total</th></tr></thead>
        <tbody>
          {rows.slice(0, 80).map((item) => (
            <tr key={item.id}>
              <td><Link href={`/admin/bookings/${item.reference}`}>{item.reference}</Link></td>
              <td>{journey(item.journeySlug)?.title}</td>
              <td>{item.contactName}</td>
              <td>{item.status}{item.demo ? " · demo" : ""}</td>
              <td>{money(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
