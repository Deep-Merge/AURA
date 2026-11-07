import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { sendContact } from "@/lib/actions";

export const metadata: Metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const query = await searchParams;
  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">Contact</p>
        <h1 className="display">Write to the desk.</h1>
        {query.sent ? <p className="notice">Received. In this demo the note is stored on the local desk.</p> : null}
        {query.error ? <p className="error">{query.error}</p> : null}
        <form className="stack-form" action={sendContact}>
          <label className="field"><span>Name</span><input name="name" required /></label>
          <label className="field"><span>Email</span><input name="email" type="email" required /></label>
          <label className="field"><span>Message</span><textarea name="notes" rows={5} required /></label>
          <button className="button" type="submit">Send</button>
        </form>
      </main>
      <Footer />
    </>
  );
}
