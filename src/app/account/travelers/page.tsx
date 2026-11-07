import { createTraveler, deleteTraveler } from "@/lib/actions";
import { currentUser } from "@/lib/auth";

export default async function TravelersPage() {
  const user = await currentUser();
  if (!user) return null;
  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Travelers</h1>
      <ul>
        {user.travelers.map((traveler) => (
          <li key={traveler.id}>
            {traveler.name} {traveler.note ? `· ${traveler.note}` : ""}
            <form action={deleteTraveler} style={{ display: "inline" }}>
              <input type="hidden" name="id" value={traveler.id} />
              <button className="text-link" type="submit">Remove</button>
            </form>
          </li>
        ))}
      </ul>
      <form className="stack-form" action={createTraveler}>
        <label className="field"><span>Name</span><input name="name" required /></label>
        <label className="field"><span>Note</span><input name="note" /></label>
        <button className="button" type="submit">Add traveler</button>
      </form>
    </>
  );
}
