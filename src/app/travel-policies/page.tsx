import type { Metadata } from "next";
import { TextPage } from "@/components/text-page";

export const metadata: Metadata = { title: "Travel policies" };

export default function PoliciesPage() {
  return (
    <TextPage eyebrow="Policies" title="Before you go.">
      <p>International flights, visas, and insurance are your responsibility. AURA can suggest a routing. It does not issue tickets in this demo.</p>
      <p>A guide may change a day because of weather, a closed road, or wildlife. The replacement stays in the same region.</p>
      <p>Sample bookings marked demo were generated for the desk. They are not reservations with a supplier.</p>
    </TextPage>
  );
}
