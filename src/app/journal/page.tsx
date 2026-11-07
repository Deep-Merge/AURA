import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Credit, Photo } from "@/components/photo";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">Journal</p>
        <h1 className="display">Sample notes, real photographs.</h1>
        <div className="rows">
          {catalog.journal.map((item) => (
            <article className="row-link" key={item.slug}>
              <Link href={`/journal/${item.slug}`}>
                <div className="frame"><Photo photo={item.image} sizes="40vw" /></div>
              </Link>
              <div>
                <h2 className="display"><Link href={`/journal/${item.slug}`}>{item.title}</Link></h2>
                <p>{item.excerpt}</p>
                <Credit photo={item.image} />
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
