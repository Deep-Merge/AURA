import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <TextPage eyebrow="About" title="A quiet desk for ambitious trips.">
      <p>AURA plans curated journeys: private departures, small groups, and trips designed around one place. The name is a portfolio brand. The photographs are real and credited. The bookings in the desk are sample records unless you create one yourself.</p>
      <p>We do not sell airline seats, and we do not claim a contract with a hotel group. A journey includes the days, the guide, the stay we describe, and the transfers on the page.</p>
    </TextPage>
  );
}
