import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { IndexSwitch } from "@/components/index-switch";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Collections" };

export default function CollectionsPage() {
  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">Collections</p>
        <h1 className="display">Twelve ways to begin.</h1>
        <div style={{ height: 28 }} />
        <IndexSwitch
          label="Collections"
          items={catalog.collections.map((item) => ({
            href: `/collections/${item.slug}`,
            title: item.name,
            meta: `${item.journeySlugs.length} journeys`,
            image: item.image,
          }))}
        />
      </main>
      <Footer />
    </>
  );
}
