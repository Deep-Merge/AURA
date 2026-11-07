import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JourneyRow } from "@/components/journey-row";
import { collection, journey } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: collection(slug)?.name ?? "Collection" };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const group = collection(slug);
  if (!group) notFound();
  const trips = group.journeySlugs.map((item) => journey(item)).filter((item) => item != null);

  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">Collection</p>
        <h1 className="display">{group.name}</h1>
        <p className="lede">{group.summary}</p>
        <div className="rows">
          {trips.map((item) => <JourneyRow key={item.slug} journey={item} />)}
        </div>
      </main>
      <Footer credit={group.image.credit} />
    </>
  );
}
