import Link from "next/link";
import { journey } from "@/lib/catalog";
import { snapshot } from "@/lib/desk";
import { formatDate, money } from "@/lib/price";

export default function AdminHome() {
  const { desk, gross, pendingValue, refundedValue, confirmedCount } = snapshot();
  const upcoming = desk.departures
    .filter((item) => item.date >= "2026-11-07")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <>
      <p className="banner">Demo data · figures are counted from the local desk</p>
      <h1 className="display" style={{ fontSize: 52 }}>The desk</h1>
      <div className="stats">
        <div className="stat"><b>{confirmedCount}</b>Confirmed and completed</div>
        <div className="stat"><b>{money(gross)}</b>Confirmed value</div>
        <div className="stat"><b>{money(pendingValue)}</b>Held or pending</div>
        <div className="stat"><b>{money(refundedValue)}</b>Refunded</div>
      </div>
      <h2>Enquiries</h2>
      <p>{desk.enquiries.length} open notes. <Link href="/admin/enquiries">Read them</Link></p>
      <h2>Upcoming departures</h2>
      <table className="table">
        <thead><tr><th>Date</th><th>Journey</th><th>Confirmed</th><th>Capacity</th></tr></thead>
        <tbody>
          {upcoming.map((item) => (
            <tr key={item.id}>
              <td>{formatDate(item.date)}</td>
              <td>{journey(item.journeySlug)?.title ?? item.journeySlug}</td>
              <td>{item.confirmed}</td>
              <td>{item.capacity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
