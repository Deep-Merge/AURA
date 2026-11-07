import { snapshot } from "@/lib/desk";

export default function DeparturesPage() {
  const { desk } = snapshot();
  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Departures</h1>
      <table className="table">
        <thead><tr><th>Date</th><th>Journey</th><th>Confirmed</th><th>Holds</th><th>Capacity</th></tr></thead>
        <tbody>
          {desk.departures.slice(0, 80).map((item) => (
            <tr key={item.id}>
              <td>{item.date}</td>
              <td>{item.journeySlug}</td>
              <td>{item.confirmed}</td>
              <td>{item.holds.length}</td>
              <td>{item.capacity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
