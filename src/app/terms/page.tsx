import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <TextPage eyebrow="Terms" title="A demonstration, clearly labeled.">
      <p>Using AURA does not create a contract for travel. Confirming a test payment records a booking in the local desk so the software can be shown. It does not purchase a trip.</p>
      <p>Photographs remain under their Creative Commons or public-domain licenses. Credits stay on the page.</p>
    </TextPage>
  );
}
