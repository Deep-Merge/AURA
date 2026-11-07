import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export function TextPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header solid />
      <main className="wrap page-hero" style={{ maxWidth: 760 }}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display">{title}</h1>
        <div className="lede" style={{ display: "grid", gap: 12 }}>{children}</div>
      </main>
      <Footer />
    </>
  );
}
