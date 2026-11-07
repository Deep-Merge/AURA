import { saveProfile } from "@/lib/actions";
import { currentUser } from "@/lib/auth";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await currentUser();
  const query = await searchParams;
  if (!user) return null;
  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Profile</h1>
      {query.saved ? <p className="notice">Saved.</p> : null}
      <form className="stack-form" action={saveProfile}>
        <label className="field"><span>Name</span><input name="name" defaultValue={user.name} required /></label>
        <label className="field"><span>Email</span><input value={user.email} readOnly /></label>
        <button className="button" type="submit">Save</button>
      </form>
    </>
  );
}
