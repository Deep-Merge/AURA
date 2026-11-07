import type { Metadata } from "next";
import { Combo } from "@/components/combo";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { sendEnquiry } from "@/lib/actions";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "A private journey" };
export const dynamic = "force-dynamic";

export default async function BespokePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const query = await searchParams;
  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">Bespoke</p>
        <h1 className="display">Tell the desk what you want.</h1>
        <p className="lede">Three short parts: where, how you like to travel, and how to reply. This is an enquiry, not a booking.</p>
        {query.sent ? <p className="notice">The enquiry is with the desk. This demo stores it locally.</p> : null}
        {query.error ? <p className="error">{query.error}</p> : null}
        <form className="stack-form" action={sendEnquiry}>
          <label className="field"><span>Places</span><input name="places" placeholder="Amalfi, Kyoto, or somewhere unnamed" /></label>
          <div className="two">
            <label className="field"><span>Dates</span><input name="dates" placeholder="June, or 12–20 September" /></label>
            <label className="field"><span>Travelers</span><input name="party" placeholder="2 adults" /></label>
          </div>
          <label className="check"><input type="checkbox" name="flexible" /> Dates can move</label>
          <label className="field">
            <span>Budget per adult</span>
            <Combo name="budget" label="Budget per adult" defaultValue="8000-12000" options={[{ value: "under-6000", label: "Under $6,000" }, { value: "8000-12000", label: "$8,000–$12,000" }, { value: "12000-plus", label: "Above $12,000" }]} />
          </label>
          <label className="field">
            <span>Style</span>
            <Combo name="style" label="Style" defaultValue="Coastal" options={["Coastal", "Island", "Cultural", "Wildlife", "Wellness", "Alpine", "Culinary"].map((style) => ({ value: style, label: style }))} />
          </label>
          <label className="field"><span>Where you sleep</span><input name="stay" placeholder="A small hotel, a house, a camp" /></label>
          <label className="field"><span>Anything else</span><textarea name="notes" rows={4} /></label>
          <label className="field"><span>Name</span><input name="name" required /></label>
          <label className="field"><span>Email</span><input name="email" type="email" required /></label>
          <p className="muted">Places already in the collection: {catalog.destinations.map((item) => item.name).join(", ")}.</p>
          <button className="button" type="submit">Send the enquiry</button>
        </form>
      </main>
      <Footer />
    </>
  );
}
