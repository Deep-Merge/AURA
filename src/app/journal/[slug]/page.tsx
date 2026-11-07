import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Credit, Photo } from "@/components/photo";
import { article } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: article(slug)?.title ?? "Journal" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = article(slug);
  if (!story) notFound();

  return (
    <>
      <Header solid />
      <main>
        <div className="detail-hero">
          <div className="frame" style={{ height: "100%" }}>
            <Photo photo={story.image} priority sizes="100vw" />
          </div>
        </div>
        <article className="wrap" style={{ padding: "36px 0 80px", maxWidth: 760 }}>
          <p className="eyebrow">Journal · sample editorial</p>
          <h1 className="display" style={{ fontSize: "clamp(40px, 6vw, 64px)" }}>{story.title}</h1>
          {story.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <Credit photo={story.image} />
        </article>
      </main>
      <Footer credit={story.image.credit} />
    </>
  );
}
