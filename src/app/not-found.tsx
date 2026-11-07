import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function NotFound() {
  return (
    <>
      <Header solid />
      <main className="wrap page-hero">
        <p className="eyebrow">404</p>
        <h1 className="display">That page is not on the map.</h1>
        <p><Link href="/journeys">Browse the journeys</Link></p>
      </main>
      <Footer />
    </>
  );
}
