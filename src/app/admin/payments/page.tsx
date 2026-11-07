import { snapshot } from "@/lib/desk";
import { money } from "@/lib/price";

export default function PaymentsPage() {
  const { desk } = snapshot();
  const rows = desk.bookings.filter((item) => item.payment || item.status === "Refunded");
  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Payments</h1>
      <p className="muted">Test-desk ledger. No card data is stored.</p>
      <table className="table">
        <thead><tr><th>Reference</th><th>Status</th><th>Total</th><th>Note</th></tr></thead>
        <tbody>
          {rows.slice(0, 60).map((item) => (
            <tr key={item.id}>
              <td>{item.reference}</td>
              <td>{item.status}</td>
              <td>{money(item.total)}</td>
              <td>{item.payment?.label ?? "Refund recorded"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
