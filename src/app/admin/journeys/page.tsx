import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { money } from "@/lib/price";

export default function AdminJourneys() {
  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Journeys</h1>
      <p className="muted">Published from the catalog. Editing copy is a content change, not a form in this version.</p>
      <table className="table">
        <thead><tr><th>Journey</th><th>Place</th><th>Nights</th><th>From</th></tr></thead>
        <tbody>
          {catalog.journeys.map((item) => (
            <tr key={item.slug}>
              <td><Link href={`/journeys/${item.slug}`}>{item.title}</Link></td>
              <td>{item.place}</td>
              <td>{item.nights}</td>
              <td>{money(item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
