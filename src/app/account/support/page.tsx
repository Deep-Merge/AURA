import { sendSupport } from "@/lib/actions";
import { currentUser } from "@/lib/auth";
import { supportFor } from "@/lib/desk";

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const user = await currentUser();
  const query = await searchParams;
  if (!user) return null;
  const notes = supportFor(user.id);
  return (
    <>
      <h1 className="display" style={{ fontSize: 48 }}>Support</h1>
      {query.sent ? <p className="notice">The note is on the desk.</p> : null}
      <form className="stack-form" action={sendSupport}>
        <label className="field"><span>Message</span><textarea name="message" rows={4} required /></label>
        <button className="button" type="submit">Send</button>
      </form>
      <ul>{notes.map((note) => <li key={note.id}>{note.message}</li>)}</ul>
    </>
  );
}
