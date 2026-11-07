import { snapshot } from "@/lib/desk";

export default function EnquiriesPage() {
  const { desk } = snapshot();
  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Enquiries</h1>
      {desk.enquiries.length === 0 ? <p>None yet. The bespoke form writes them here.</p> : (
        <table className="table">
          <thead><tr><th>When</th><th>Name</th><th>Places</th><th>Status</th></tr></thead>
          <tbody>
            {desk.enquiries.map((item) => (
              <tr key={item.id}>
                <td>{item.createdAt.slice(0, 10)}</td>
                <td>{item.name}<br />{item.email}</td>
                <td>{item.places}<br />{item.notes}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
